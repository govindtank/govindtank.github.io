#!/usr/bin/env python3
"""Verify a pool of public Unsplash CDN image URLs. Keeps only URLs returning HTTP 200 + image/* content type."""
import urllib.request, ssl, concurrent.futures, json, sys

# Known-stable Unsplash photo IDs (images.unsplash.com CDN). Includes the 9 already used on the site (proven live).
PHOTO_IDS = [
    # already in use on the site (proven live)
    "1555066931-4365d14bab8c", "1551288049-bebda4e38f71", "1620712943543-bcc4688e7485",
    "1517694712202-14dd9538aa97", "1485827404703-89b55fcc595e", "1677442136019-21780ecad995",
    "1526374965328-7f61d4dc18c5", "1451187580459-43490279c0fa", "1558494949-ef010cbdcc31",
    # AI / ML / data
    "1679008911894-6ab6d086d8de", "1676270229122-fbd9d5b2c0de", "1555949963-ff9fe0c870eb",
    "1504868584819-f8e8b4b6d7e3", "1550751827-4bd374c3f58b", "1563986768609-322da13575f3",
    "1573164713988-8665fc963095", "1518770660439-4636190af475", "1550745165-9bc0b252726f",
    "1515879218367-8466d910aaa4", "1531297484001-80022131f5a1", "1487058792275-0ad4aaf24ca7",
    "1504639725590-34d0984388bd", "1544197150-b99a580bb7a8", "1550439062-609e1531270e",
    "1633414462723-088b8c4b4f36", "1677509959324-349cd70a3a6d", "1611974789855-9c2a0a7236a3",
    # code / dev / screens
    "1461749280684-dccba630e2f6", "1517180102446-f3ece451e9d8", "1522071820081-009f0129c71c",
    "1504384308090-c894fdcc538d", "1519389950473-47ba0277781c", "1526628953301-3e589a6a8b74",
    "1516321318423-f06f85e504b3", "1547658719-da2b51169166", "1537432377119-e153221120bc",
    "1550547660-d9450f859349", "1607252650365-f407e6b96cb3", "1571171637578-41bc2dd41cd2",
    "1555963962-6a5b6e1e4b0a", "1518946811516-5ee35e062b03", "1498050108023-c5249f4df085",
    "1587620962725-abab7fe55159", "1552308135-76fc06b742b6", "1534972195531-d756b9bfa9f2",
    # cloud / infra / servers
    "1454165804606-c3d57bc86b40", "1460925895917-afdab827c52f", "1508830524289-0adcbe822b40",
    "1484417894907-623942c8ee29", "1499951360447-b19be8fe80f5", "1541462608143-67571c6738dd",
    "1564865878688-9a244444042a", "1558494949-ef010cbdcc31", "1602992708529-97d42c6d4a2f",
    "1614064641938-3bbee52942c7", "1620121692029-d088224ddc74", "1655720828018-edd2daec8c6d",
    # mobile / devices / UI
    "1526401485004-46910ecc8e51", "1512429234305-512738320475", "1523193244231-6fecfc855b0c",
    "1511707171634-5f897ff02aa9", "1510557880182-3d4d3cba35a5", "1580910051074-3eb694886505",
    "1606220945770-b5b6c2c55bf1", "1512941937669-90a1b58e7e9c", "1522252234503-e356532cafd5",
    # architecture / workspace / abstract
    "1486406146926-c627a92ad1ab", "1497366216548-37526070297c", "1497366811353-6870744d04b2",
    "1524758631624-e2822e304c36", "1499750310107-5fef28a66643", "1553877522-43269d4ea984",
    "1552664730-d307ca884978", "1542744173-8e7e53415bb0", "1556761175-b413da4baf72",
    "1557804506-669a67965ba0", "1551650975-87deedd944c3", "1522199755839-a2bacb67c546",
    "1560732486-186f25beb3ec", "1559526324-4b87b5e36e44", "1550179709-d4f1e94b5b4c",
    "1593642632823-8f785ba67e45", "1510915228340-29c85a43dcfe", "1522542550221-31fd19575a2d",
]

BASE = "https://images.unsplash.com/photo-{id}?auto=format&fit=crop&q=80&w=1200"

def check(pid):
    url = BASE.format(id=pid)
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            ct = resp.headers.get("Content-Type", "")
            if resp.status == 200 and ct.startswith("image/"):
                return (url, True, f"{resp.status} {ct}")
            return (url, False, f"{resp.status} {ct}")
    except Exception as e:
        return (url, False, str(e)[:60])

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
    results = list(ex.map(check, PHOTO_IDS))

ok = [r for r in results if r[1]]
bad = [r for r in results if not r[1]]
print(f"VERIFIED: {len(ok)}/{len(results)}")
for url, _, info in ok:
    print(url)
print(f"\nFAILED ({len(bad)}):")
for url, _, info in bad:
    print(f"  {info} {url}")

with open("/tmp/verified_images.json", "w") as f:
    json.dump([r[0] for r in ok], f, indent=1)
