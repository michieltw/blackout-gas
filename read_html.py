with open("blackout-league/dist/index.html", "r") as f:
    content = f.read()
    with open("/tmp/output.html", "w") as f_out:
        f_out.write(content)
print(len(content))
