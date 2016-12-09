#!/bin/bash
echo "Installing test dependencies..."
echo "1/7"
(cd example/basic-with-router; npm install &> /dev/null)
echo "2/7"
(cd example/css-modules; npm install &> /dev/null)
echo "3/7"
(cd example/deep-route-nesting; npm install &> /dev/null)
echo "4/7"
(cd example/extract-css; npm install &> /dev/null)
echo "5/7"
(cd example/with-template; npm install &> /dev/null)
echo "6/7"
(cd example/with-auth; npm install &> /dev/null)
echo "7/7"
(cd example/redux; npm install &> /dev/null)
echo "Finished installing test all dependencies."
