"""Measure HTTP end-to-end warm chat latency. Start backend first."""
import json
import statistics
import time
import urllib.request

URL='http://127.0.0.1:8000/api/chat/'
results=[]
for i in range(50):
    data=json.dumps({'message':'hello'}).encode()
    request=urllib.request.Request(URL,data=data,headers={'Content-Type':'application/json'})
    start=time.perf_counter()
    with urllib.request.urlopen(request,timeout=5) as response:
        response.read()
    results.append((time.perf_counter()-start)*1000)
results.sort()
print({'requests':len(results),'p50_ms':round(statistics.median(results),2),'p95_ms':round(results[int(len(results)*.95)-1],2),'max_ms':round(max(results),2)})
