#ifndef GLOBAL_H
#define GLOBAL_H

#include <stdlib.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <stdio.h>

/* RUNNING_IN_RASPBERRY is setting from Makefile. */

#ifdef RUNNING_IN_RASPBERRY
#include <wiringPi.h>
#define TEMPERATURE_SENSING_IS_ACTIVE
#else
typedef enum {LOW, HIGH} voltage;
#endif

typedef enum {FALSE, TRUE} boolean;

enum lampId
{
    FIRST_LAMP_ID  = 1,
    SECOND_LAMP_ID = 2,
    THIRD_LAMP_ID  = 3,
    MAX_LAMP_COUNT = 3
};

enum sprinklerId
{
    FIRST_SPRINKLER_ID  = 1,
    SECOND_SPRINKLER_ID = 2,
    THIRD_SPRINKLER_ID  = 3,
    FOURTH_SPRINKLER_ID = 4,
    MAX_SPRINKLER_COUNT = 4
};

enum TempSensorId
{
    FIRST_TEMPSENSOR_ID  = 1,
    MAX_TEMPSENSOR_COUNT = 1
};

/* Will be very useful when we do have a continuous ID decleration without separating types. */
#define MAX_ITEM_COUNT   MAX_SPRINKLER_COUNT + MAX_LAMP_COUNT + MAX_TEMPSENSOR_COUNT
#define CMD_LEN          3 

typedef enum 
{
    TEMP_HEADER,
    LAMP_HEADER,
    SPRINKLER_HEADER,
    WINDOW_HEADER,
    INIT_HEADER,
    SEPARATOR
}Message;

typedef enum
{
    UP,
    DOWN,
    STOP,
    IDLE
}Action;

#endif
