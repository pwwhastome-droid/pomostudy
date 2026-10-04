import os

with open("android/app/build.gradle", "r") as f:
    content = f.read()

signing_config = """
        release {
            storeFile file("release.jks")
            storePassword "pomostudy2026"
            keyAlias "pomostudy"
            keyPassword "pomostudy2026"
            v1SigningEnabled true
            v2SigningEnabled true
        }
"""

if "signingConfigs {" in content:
    content = content.replace("signingConfigs {", "signingConfigs {" + signing_config, 1)
else:
    content = content.replace("android {", "android {\n    signingConfigs {\n" + signing_config + "    }\n", 1)

content = content.replace(
    "buildTypes {\n        release {",
    "buildTypes {\n        release {\n            signingConfig signingConfigs.release"
)

with open("android/app/build.gradle", "w") as f:
    f.write(content)

print("build.gradle updated with release signingConfig!")
