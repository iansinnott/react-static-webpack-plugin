#!/bin/bash
echo "Installing test dependencies..."
echo "1/6"
(cd example/basic-with-router; npm install &> /dev/null)
echo "2/6"
(cd example/css-modules; npm install &> /dev/null)
echo "3/6"
(cd example/deep-route-nesting; npm install &> /dev/null)
echo "4/6"
(cd example/extract-css; npm install &> /dev/null)
echo "5/6"
(cd example/with-template; npm install &> /dev/null)
echo "6/6"
(cd example/redux; npm install &> /dev/null)
echo "Finished installing test all dependencies."
