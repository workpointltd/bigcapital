# Rebuilding Process

## Update Yarn

yarn set version stable

yarn install

## Build Packages Modules

### Build first package
cd packages/webapp

yarn install

yarn build

### Build second package


cd packages/server

yarn install

yarn build


### Build Multi-module

cd ../..

yarn build


