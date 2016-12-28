#!/bin/bash
echo "Installing test dependencies..."
echo "0/10"
(cd example/basic-with-router; yarn install &> /dev/null)
echo "1/10"
(cd example/css-modules; yarn install &> /dev/null)
echo "2/10"
(cd example/deep-route-nesting; yarn install &> /dev/null)
echo "3/10"
(cd example/extract-css; yarn install &> /dev/null)
echo "4/10"
(cd example/with-template; yarn install &> /dev/null)
echo "5/10"
(cd example/with-mock-auth; yarn install &> /dev/null)
echo "6/10"
(cd example/redux; yarn install &> /dev/null)
echo "7/10"
(cd example/with-static-markup; yarn install &> /dev/null)
echo "8/10"
(cd example/with-auth0; yarn install &> /dev/null)
echo "9/10"
(cd example/webpack-2; yarn install &> /dev/null)
echo "10/10. Finished installing test all dependencies."
