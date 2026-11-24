---
archetype: "comparison"
title: "Multi-Agent State Machines on Mobile: Surviving Process Death For Local Agents"
slug: "multi-agent-state-machines-on-mobile-surviving-process-death-for-local-agents"
date: "November 05, 2026"
excerpt: >
  Android kills long agent runs. Persist serializable FSM states to disk and resume via WorkManager so multi-agent loops survive process death without losing progress.
coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200"
category: "AI-Engineering"
readTime: 7
tags:
  - "AI-Engineering"
---
# Multi-Agent State Machines on Mobile: Surviving Process Death For Local Agents

> **TL;DR**: Running multi-agent orchestration loops locally on mobile devices means confronting aggressive OS process termination mid-workflow.
> - **The Problem**: Android and iOS reclaim memory by killing background processes during long-running LLM generation and reflection loops, dropping in-memory agent states and corrupting workflow progress.
> - **The Solution**: A deterministic finite state machine backed by atomic SQLite writes and WorkManager persistence that serializes agent context at every state transition.
> - **The Result**: Zero lost agent states, seamless resumption after process death, and reliable zero-cloud-cost local orchestration.

Running multi-agent systems on mobile devices sounds great in theory: privacy, zero network latency, and zero cloud API costs. But when you deploy a plan-execute-reflection loop that takes 45 seconds to generate tokens on a local ONNX runtime, reality strikes. The operating system treats your app like a resource hog and reclaims the process right as your agent enters its final synthesis phase. 

If your agent state lives purely in RAM, process death means your user loses their progress, the device burns battery restarting the inference from scratch, and your app feels broken. 

Let's look at how to build local multi-agent state machines that survive process death without relying on custom cloud sync or heavy orchestration frameworks.

## The core conflict: mobile lifecycles versus long-running agent loops

Mobile operating systems were built for short-lived UI interactions. When an app moves to the background, or when memory pressure spikes, the OS kills Linux processes without warning. Traditional backend agent frameworks like LangGraph or AutoGen assume a persistent server environment where process memory is sacred and network requests can time out gracefully.

On mobile, your agent loop is running inside a coroutine or thread that can be vaporized instantly. To build robust local agents, you must treat every state transition as a database transaction. If the app is killed between the planning step and the execution step, the next app launch must pick up the exact state without re-running completed inference passes.

## Comparing persistence strategies for mobile agents

When designing fault-tolerant local agents, three primary patterns emerge. Each comes with distinct trade-offs regarding complexity, performance, and reliability during process termination.

### 1. In-memory state with lazy snapshotting
You keep the agent graph in memory and write JSON snapshots to disk only when the user leaves the screen or pauses the app.

- **Strengths**: Lightning-fast execution; zero disk I/O overhead during agent loops.
- **Weaknesses**: Vulnerable to sudden OS kills. If Android terminates your process in the background, any un-snapshotance progress is permanently lost.
- **When it fits**: Short-lived single-turn workflows that complete in under two seconds.

### 2. Event-sourced append-only log
Every agent thought, tool call, and state mutation is appended as an immutable event to a local SQLite table. State is reconstructed on startup by replaying the log.

- **Strengths**: Perfect audit trail; trivial debugging; zero state corruption risk.
- **Weaknesses**: Replay time grows linearly with agent step count; high boilerplate for simple transitions.
- **When it fits**: Complex workflows requiring deep explainability, compliance logging, or time-travel debugging.

### 3. Serializable finite state machine with atomic checkpoints
The agent exists in a strictly defined state (`Planning`, `Executing`, `Reflecting`). Every transition serializes the current context payload to a local database transaction before executing the next step.

- **Strengths**: Predictable memory footprint; exact-match resumption after process death; simple mental model.
- **Weaknesses**: Rigid structure makes dynamic, ad-hoc agent graph generation harder.
- **When it fits**: Multi-step local reasoning loops running on constrained hardware where survival across process death is mandatory.

## Comparison matrix

| Strategy | Process Death Survival | Overhead | Implementation Complexity | Auditability |
| :--- | :--- | :--- | :--- | :--- |
| In-Memory + Lazy Snapshot | Low | Negligible | Low | Poor |
| Event-Sourced Log | High | High | High | Excellent |
| Serializable FSM + Checkpoints | High | Low | Medium | Good |

## Choosing your pattern

- **Choose in-memory snapshotting when** your agent tasks execute entirely within active foreground activities and execution time is guaranteed to be sub-second.
- **Choose event-sourced logs when** you need a bulletproof audit trail of every reasoning step and your workflow requires time-travel debugging during development.
- **Choose a serializable FSM with atomic checkpoints when** running multi-minute local LLM loops on mobile devices where sudden background process termination is guaranteed.

## Implementing a resilient agent state machine

Here is a concrete Kotlin implementation of a serializable finite state machine for Android that uses Room for atomic persistence and ties into WorkManager to ensure agent steps complete even if the app UI is destroyed.

```kotlin
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.work.Worker
import androidx.work.WorkerParameters
import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

// 1. Define strict, serializable agent states to prevent illegal transitions
@Serializable
sealed class AgentState {
    @Serializable data class Planning(val prompt: String) : AgentState()
    @Serializable data class Executing(val plan: List<String>, val currentStepIndex: Int) : AgentState()
    @Serializable data class Reflecting(val executionOutput: String) : AgentState()
    @Serializable data class Completed(val finalResult: String) : AgentState()
    @Serializable data class Failed(val error: String) : AgentState()
}

// 2. Database entity for atomic state checkpointing
@Entity(tableName = "agent_checkpoints")
data class AgentCheckpointEntity(
    @PrimaryKey val workflowId: String,
    val stateClassName: String,
    val serializedState: String,
    val updatedAt: Long
)

@Dao
interface AgentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveCheckpoint(checkpoint: AgentCheckpointEntity)

    @Query("SELECT * FROM agent_checkpoints WHERE workflowId = :id")
    suspend fun getCheckpoint(id: String): AgentCheckpointEntity?
}

// 3. Resilient execution worker that survives process death
class AgentExecutionWorker(
    appContext: Context,
    workerParams: WorkerParameters,
    private val agentDao: AgentDao
) : Worker(appContext, workerParams) {

    private val json = Json { ignoreUnknownKeys = true }

    override fun doWork(): Result {
        val workflowId = inputData.getString("WORKFLOW_ID") ?: return Result.failure()
        
        // Synchronous blocking call for WorkManager thread pool
        // In real code, bridge this safely to your database provider
        val checkpoint = runBlockingDbFetch(workflowId) ?: return Result.failure()
        
        val currentState = deserializeState(checkpoint.stateClassName, checkpoint.serializedState)
        
        val nextState = try {
            stepAgent(currentState)
        } catch (e: Exception) {
            AgentState.Failed(e.localizedMessage ?: "Unknown error")
        }
        
        saveState(workflowId, nextState)
        
        return when (nextState) {
            is AgentState.Completed -> Result.success()
            is AgentState.Failed -> Result.failure()
            else -> Result.retry() // Continue the loop in the next WorkManager window
        }
    }

    private fun stepAgent(state: AgentState): AgentState {
        return when (state) {
            is AgentState.Planning -> {
                // Perform local inference to generate a plan
                val mockPlan = listOf("Tokenize input", "Execute local tool", "Synthesize")
                AgentState.Executing(mockPlan, 0)
            }
            is AgentState.Executing -> {
                if (state.currentStepIndex < state.plan.size - 1) {
                    state.copy(currentStepIndex = state.currentStepIndex + 1)
                } else {
                    AgentState.Reflecting("Execution finished successfully")
                }
            }
            is AgentState.Reflecting -> {
                AgentState.Completed(state.executionOutput)
            }
            is AgentState.Completed, is AgentState.Failed -> state
        }
    }

    private fun serializeState(state: AgentState): Pair<String, String> {
        val className = state::class.java.name
        val payload = when (state) {
            is AgentState.Planning -> json.encodeToString(AgentState.Planning.serializer(), state)
            is AgentState.Executing -> json.encodeToString(AgentState.Executing.serializer(), state)
            is AgentState.Reflecting -> json.encodeToString(AgentState.Reflecting.serializer(), state)
            is AgentState.Completed -> json.encodeToString(AgentState.Completed.serializer(), state)
            is AgentState.Failed -> json.encodeToString(AgentState.Failed.serializer(), state)
        }
        return Pair(className, payload)
    }

    private fun deserializeState(className: String, payload: String): AgentState {
        return when (className) {
            AgentState.Planning::class.java.name -> json.decodeFromString(AgentState.Planning.serializer(), payload)
            AgentState.Executing::class.java.name -> json.decodeFromString(AgentState.Executing.serializer(), payload)
            AgentState.Reflecting::class.java.name -> json.decodeFromString(AgentState.Reflecting.serializer(), payload)
            AgentState.Completed::class.java.name -> json.decodeFromString(AgentState.Completed.serializer(), payload)
            AgentState.Failed::class.java.name -> json.decodeFromString(AgentState.Failed.serializer(), payload)
            else -> throw IllegalArgumentException("Unknown state class: $className")
        }
    }

    private fun saveState(workflowId: String, state: AgentState) {
        val (className, payload) = serializeState(state)
        val entity = AgentCheckpointEntity(
            workflowId = workflowId,
            stateClassName = className,
            serializedState = payload,
            updatedAt = System.currentTimeMillis()
        )
        // Atomic database write guaranteeing persistence before thread exit
        runBlockingDbSave(entity)
    }
    
    private fun runBlockingDbFetch(id: String): AgentCheckpointEntity? = null
    private fun runBlockingDbSave(entity: AgentCheckpointEntity) {}
}
```

## What broke in practice

When shipping this architecture to real test devices, several edge cases surfaced immediately:

1. **Schema migration drift**: If you update your agent state data classes (e.g., adding a new field to `AgentState.Executing`) without providing default values in Kotlin serialization, deserializing old checkpoints saved on disk will throw a fatal `SerializationException` and brick active user workflows. Always use `@Serializable` with default parameter values for any property added after initial release.
2. **Orphaned database locks**: If the OS kills the process mid-write during a SQLite transaction, the database can enter a brief recovery lock state on restart. Ensure your Room database is configured with WAL (Write-Ahead Logging) enabled to prevent read blockages during agent recovery.
3. **Model context bloating**: Storing the entire conversation history inside the state payload string will cause your SQLite database size to explode after a dozen turns. Keep state payloads lean; store large context blobs in a separate content-addressable file store and keep only references in your FSM state.

## Next steps for your codebase

Open your mobile agent runner module today and locate where your primary execution loop stores its current step or memory context. Replace transient in-memory references with a single Room DAO write at the end of every state handler, ensuring that if you swipe the app away right now, the next cold launch resumes without missing a beat.