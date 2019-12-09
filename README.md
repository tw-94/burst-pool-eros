# ![EROS](https://i.ibb.co/VT2y6JW/31c66ab5-b703-4984-b5cd-82548be29c9c-200x200.png)

### Eros Pool-Software
The eros software has roots in the backend of uraymeiviar and SOELexicon. The frontend has been rewritten and has a new engine implemented. Many bugs in the backend were fixed and additional features implemented. If you find the software useful, it would be nice to make a donation.

Donate to the address BURST-2QQ5-6477-ZFK5-BQCH4 or set devFee to true.

In case of errors or problems, please create a new issues.

### Short Install Instruction

install all required modules

```
npm install or npm install 'module-name'
```

After that run

```
frontend.bat
backend.bat
historicBlocks.bat
getNames.bat
getHistoricBlocks.bat
```

### Long Install Instruction

1. Download a node version https://nodejs.org/en/ or copy the .zip version to the eros folder.
2. After node is detected, open cmd prompt and change direction to eros folder cd [..]/burst-pool-master inside burst-pool-master run: npm install

The following modules will be installed: https://github.com/BurstNeon/burst-pool-eros/blob/master/package.json

After the installation configure the pool-config.js https://github.com/BurstNeon/burst-pool-eros/blob/master/burst-pool-config.js

and run

```
frontend.bat
backend.bat
historicBlocks.bat
getNames.bat
getHistoricBlocks.bat
```
