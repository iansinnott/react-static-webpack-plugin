#!/bin/bash
echo "Installing test dependencies..."
echo "0/10"
(cd example/basic-with-router; npm install &> /dev/null)
echo "1/10"
(cd example/css-modules; npm install &> /dev/null)
echo "2/10"
(cd example/deep-route-nesting; npm install &> /dev/null)
echo "3/10"
(cd example/extract-css; npm install &> /dev/null)
echo "4/10"
(cd example/with-template; npm install &> /dev/null)
echo "5/10"
(cd example/with-mock-auth; npm install &> /dev/null)
echo "6/10"
(cd example/redux; npm install &> /dev/null)
echo "7/10"
(cd example/with-static-markup; npm install &> /dev/null)
echo "8/10"
(cd example/with-auth0; npm install &> /dev/null)
echo "9/10"
(cd example/webpack-2; npm install &> /dev/null)
echo "10/10. Finished installing test all dependencies."
