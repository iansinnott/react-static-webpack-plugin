#!/bin/bash
echo "Installing test dependencies..."
echo "1/8"
(cd example/basic-with-router; npm install &> /dev/null)
echo "2/8"
(cd example/css-modules; npm install &> /dev/null)
echo "3/8"
(cd example/deep-route-nesting; npm install &> /dev/null)
echo "4/8"
(cd example/extract-css; npm install &> /dev/null)
echo "5/8"
(cd example/with-template; npm install &> /dev/null)
echo "6/8"
(cd example/with-auth; npm install &> /dev/null)
echo "7/8"
(cd example/redux; npm install &> /dev/null)
echo "8/8"
(cd example/with-static-markup; npm install &> /dev/null)
echo "Finished installing test all dependencies."