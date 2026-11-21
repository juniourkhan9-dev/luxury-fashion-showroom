@echo off
set "PATH=C:\Users\advance computer\AppData\Local\Programs\MinGit\cmd;%PATH%"
cd /d "C:\Users\advance computer\.gemini\antigravity\scratch\luxury-fashion-showroom"
git checkout gh-pages
xcopy /E /Y /I dist\* .
git add .
git commit -m DeployBrightenShowroom
git push origin gh-pages
git checkout main
