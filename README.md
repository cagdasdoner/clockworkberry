Date-time : 31.01.2015 22:10

0. Connect your raspberry via ssh from your PC:
    $ ssh IP_ADDR_OF_PI -l pi


1. Install nodejs to your raspberry.

    Raspberry repos have a nodejs pre-built release of course but it is too old. (v0.6.19)
    It will be good to have something new. So we need to install it manually which has released for ARM and has pi utils.  

    $ wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz
    $ tar -xzf node-v0.10.28-linux-arm-pi.tar.gz
    $ node-v0.10.28-linux-arm-pi/bin/node --version
    v0.10.28

    For other nodejs distros, check http://nodejs.org/dist/.


2. Organize binaries and paths.

    $ mv node-v0.10.28-linux-arm-pi/bin/ /opt
    $ sudo cp /opt/node-v0.10.28-linux-arm-pi/bin/* /usr/local/bin/
    $ PATH=$PATH:/opt/node-v0.10.28-linux-arm-pi/bin/
    
    
3. Install wiring pi to GPIO control.

    $ sudo apt-get install git-core
    $ sudo apt-get update
    $ sudo apt-get upgrade
    $ git clone git://git.drogon.net/wiringPi
    $ cd wiringPi
    $ git pull origin
    $ ./build


4. Install SQLite3.

    $ sudo apt-get install sqlite3
    
    
5. Change timezone settings. 

    $ sudo raspi-config 
    
    Form the given menu path below, choose Istanbul timezone:
    Internationalization Options -> Change Timezone -> Europe/Istanbul
    
    
5. Get the source code.
    
    I prefer check out the source code to my PC first due to ease of file modificaiton and browsing.
    After that, secure copy them to raspberry. Assuming that, you've created homeAutomation dir to your raspberry, type these from your PC to write to your raspberry:
    
    $ git clone https://github.com/cagdasdoner/clockworkberry.git
    $ scp -r  ./homeAutomation/*   pi@IP_ADDR_OF_PI:/home/pi/homeAutomation/
    
    After copying has completed, go to your raspberry to install required modules and start web and raspberry sock server :
    
    $ cd homeAutomation/
    $ npm install --production
    $ cd socket/
    $ make raspberry
    $ cd ..
    $ . boot.sh

    Please notice that server.c and server.js are gonna be a background process.
    The "npm install" step would take some time due to size of our module variety.
    
    
6. Add the boot.sh script to make your servers running on every boot of raspberry yar raspberry.
    
    $ sudo nano /etc/rc.local
    
    Insert the line below at the end of the rc.local : 
    
    cd /home/pi/homeAutomation/
    pwd
    source boot.sh
    
    Remove error handling of the script by removing -e from your shebang. It will loke like :
    #!/bin/bash
    not 
    #!/bin/bash -e
    
7. Setting static IP for ifaces :
    
    Change your /etc/network/interfaces file like below:
    
    iface eth0 inet static
    address 192.168.5.200
    netmask 255.255.255.0
    gateway 192.168.5.1
    broadcast 192.168.5.255
    dns-nameservers 8.8.8.8 4.4.4.4
    
    On wifi using scenario, you need to disable eth0 static IP settings or botw of the IFs will be up and ten it gonna crush with route collision.

APPENDIX I. Simulating from PC.
    
    After check out the source code, you would do the same as you do in raspberry before, but with some different target infos. Type below strings from your PC to simulate wo raspberry:
    
    $ cd homeAutomation/socket/
    $ make PC
    $ cd ..
    $ . boot.sh

APPEDNDIX II. GPIO Settings for Items
    
    Please find a useful GPIO mapping demonstration below:
    http://pi4j.com/pins/model-b-plus.html

APPENDIX III. Version mismatch of Npm

    Npm is a lib for nodejs pack manager. We have to use it but due to some arm version mismatches, we may need to update it manually. It is so simple. Type the command below from your raspi:

    $ curl -0 -L http://npmjs.org/install.sh | sudo sh

APPENDIX IV. Logging system

    Server side logs could be found under logs/ dir. You can optimize logging system params within given section for log4js @ server.js.
