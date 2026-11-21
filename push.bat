@echo off
set "PATH=C:\Users\advance computer\AppData\Local\Programs\MinGit\cmd;%PATH%"
cd /d "C:\Users\advance computer\.gemini\antigravity\scratch\luxury-fashion-showroom"
git add src/
git commit -m "Remove defective oatmeal sweatshirt item"
git push origin main
git checkout gh-pages
xcopy /E /Y /I dist\* .
git add .
git commit -m "Update build without oatmeal sweatshirt"
git push origin gh-pages
git checkout main
echo DONE
