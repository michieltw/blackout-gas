with open("/tmp/output.html", "r") as f:
    content = f.read()
print(f"Index.html length: {len(content)} bytes")
