#!/bin/bash
echo "Installing test dependencies..."
echo "1/9"
(cd example/basic-with-router; npm install &> /dev/null)
echo "2/9"
(cd example/css-modules; npm install &> /dev/null)
echo "3/9"
(cd example/deep-route-nesting; npm install &> /dev/null)
echo "4/9"
(cd example/extract-css; npm install &> /dev/null)
echo "5/9"
(cd example/with-template; npm install &> /dev/null)
echo "6/9"
(cd example/with-mock-auth; npm install &> /dev/null)
echo "7/9"
(cd example/redux; npm install &> /dev/null)
echo "8/9"
(cd example/with-static-markup; npm install &> /dev/null)
echo "9/9"
(cd example/with-auth0; npm install &> /dev/null)
echo "Finished installing test all dependencies."
