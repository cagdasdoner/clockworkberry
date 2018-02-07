#ifndef PORTING_GPIO_H
#define PORTING_GPIO_H

#include "global.h"

#define LAMP1_GPIO_PIN 25
#define LAMP2_GPIO_PIN 24
#define LAMP3_GPIO_PIN 23

#define SPRINKLER1_GPIO_PIN 29
#define SPRINKLER2_GPIO_PIN 28
#define SPRINKLER3_GPIO_PIN 27
#define SPRINKLER4_GPIO_PIN 26

#define INVALID_GPIO_PIN    999

short int init_gpio();
boolean get_lamp_status(unsigned short int lamp_id);
boolean get_sprinkler_status(unsigned short int sprinkler_id);
boolean perform_gpio_operation(unsigned  short int active_gpio, boolean active_status);
unsigned short int get_lamp_gpio(unsigned short int sprinkler_id);
unsigned short int get_sprinkler_gpio(unsigned short int sprinkler_id);

#endif
