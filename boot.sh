
#!/bin/bash
cd socket/
source killserver
sudo rm -f write.sock
sudo rm -f read.sock
sudo ./server &
sleep 2
sudo chmod 777 write.sock
sleep 1
cd ..
/usr/local/bin/node server.js PC &

