@echo off
echo NPM PUBLISH
echo Before continuing, ensure that:
echo - you are logged in (npm whoami)
echo - you have successfully rebuilt all the libraries (npm run...)
pause

cd .\dist\myrmidon\ngx-annotorious
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-img-gallery
call npm publish --access=public
cd ..\..\..
pause

cd .\dist\myrmidon\cadmus-img-gallery-iiif
call npm publish --access=public
cd ..\..\..
pause

echo ALL DONE
