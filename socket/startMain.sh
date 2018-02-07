#!/bin/bash
. killserver
sudo rm -f write.sock
sudo ./server &
sleep 2
sudo chmod 777 write.sock



