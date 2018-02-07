CC=gcc
RASPBERRY_FILES=server.c porting_DS1620.c porting_gpio.c porting_window.c
PC_FILES=server.c porting_DS1620.c porting_gpio.c porting_window.c
INC=-Iinclude
OUT_EXE=server
LIBS=-lwiringPi
CFLAGS=-DRUNNING_IN_RASPBERRY

default: raspberry

raspberry: $(FILES)
	$(CC) $(CFLAGS) -o $(OUT_EXE) $(RASPBERRY_FILES) $(LIBS) $(INC)
	
PC: $(FILES)
	$(CC) -o $(OUT_EXE) $(PC_FILES) $(INC)

clean:
	rm -f OUT_EXE core

