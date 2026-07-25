import sys
print("Python:", sys.version)
errors = []
try:
    import flask
    print("flask: OK")
except ImportError as e:
    errors.append(("flask", str(e)))
    print("flask: MISSING -", e)
try:
    import flask_cors
    print("flask_cors: OK")
except ImportError as e:
    errors.append(("flask-cors", str(e)))
    print("flask_cors: MISSING -", e)
try:
    import numpy
    print("numpy: OK")
except ImportError as e:
    errors.append(("numpy", str(e)))
    print("numpy: MISSING -", e)
if errors:
    print("\nMISSING PACKAGES! Run:")
    pkgs = " ".join(p for p, _ in errors)
    print(f"  pip install {pkgs}")
else:
    print("\nAll dependencies OK!")
input("\nPress Enter to close...")
