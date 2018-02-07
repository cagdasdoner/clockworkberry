#include "include/porting_gpio.h"

short int init_gpio()
{
    short int ret_val = 0;
#ifdef RUNNING_IN_RASPBERRY
    if((ret_val = wiringPiSetup()) != -1)
    {
        pinMode(LAMP1_GPIO_PIN, OUTPUT);
        pinMode(LAMP2_GPIO_PIN, OUTPUT);
        pinMode(LAMP3_GPIO_PIN, OUTPUT);
        
        pinMode(SPRINKLER1_GPIO_PIN, OUTPUT);
        pinMode(SPRINKLER2_GPIO_PIN, OUTPUT);
        pinMode(SPRINKLER3_GPIO_PIN, OUTPUT);
        pinMode(SPRINKLER4_GPIO_PIN, OUTPUT);
    }
    else
    {
        printf("WiringPi failed.\n");
    }
#endif
    return ret_val;
}

boolean get_lamp_status(unsigned short int lamp_id)
{
    unsigned short int cur_lamp_stat = 0;
#ifdef RUNNING_IN_RASPBERRY
    if(lamp_id == FIRST_LAMP_ID)
    {
        cur_lamp_stat = digitalRead(LAMP1_GPIO_PIN);
    }
    else if(lamp_id == SECOND_LAMP_ID)
    {
        cur_lamp_stat = digitalRead(LAMP2_GPIO_PIN);
    }
    else if(lamp_id == THIRD_LAMP_ID)
    {
        cur_lamp_stat = digitalRead(LAMP3_GPIO_PIN);
    }
#endif
    return cur_lamp_stat;
}

boolean get_sprinkler_status(unsigned short int sprinkler_id)
{
    unsigned short int cur_sprinkler_stat = 0;
#ifdef RUNNING_IN_RASPBERRY
    if(sprinkler_id == FIRST_SPRINKLER_ID)
    {
        cur_sprinkler_stat = digitalRead(SPRINKLER1_GPIO_PIN);
    }
    else if(sprinkler_id == SECOND_SPRINKLER_ID)
    {
        cur_sprinkler_stat = digitalRead(SPRINKLER2_GPIO_PIN);
    }
    else if(sprinkler_id == THIRD_SPRINKLER_ID)
    {
        cur_sprinkler_stat = digitalRead(SPRINKLER3_GPIO_PIN);
    }
    else if(sprinkler_id == FOURTH_SPRINKLER_ID)
    {
        cur_sprinkler_stat = digitalRead(SPRINKLER4_GPIO_PIN);
    }
#endif
    return cur_sprinkler_stat;
}

unsigned short int get_sprinkler_gpio(unsigned short int sprinkler_id)
{
    unsigned short int active_gpio = INVALID_GPIO_PIN;
    if(sprinkler_id == FIRST_SPRINKLER_ID)
    {
        active_gpio = SPRINKLER1_GPIO_PIN;
    }
    else if(sprinkler_id == SECOND_SPRINKLER_ID)
    {
        active_gpio = SPRINKLER2_GPIO_PIN;
    }
    else if(sprinkler_id == THIRD_SPRINKLER_ID)
    {
        active_gpio = SPRINKLER3_GPIO_PIN;
    }
    else if(sprinkler_id == FOURTH_SPRINKLER_ID)
    {
        active_gpio = SPRINKLER4_GPIO_PIN;
    }
    else
    {
        printf("Not a valid GPIO item!\n");
    }
    
    return active_gpio;
}

unsigned short int get_lamp_gpio(unsigned short int lamp_id)
{
    unsigned short int active_gpio = INVALID_GPIO_PIN;
    if(lamp_id == FIRST_LAMP_ID)
    {
        active_gpio = LAMP1_GPIO_PIN;
    }
    else if(lamp_id == SECOND_LAMP_ID)
    {
        active_gpio = LAMP2_GPIO_PIN;
    }
    else if(lamp_id == THIRD_LAMP_ID)
    {
        active_gpio = LAMP3_GPIO_PIN;
    }
    else
    {
        printf("Not a valid GPIO item!\n");
    }
    
    return active_gpio;
}



boolean perform_gpio_operation(unsigned short int active_gpio, boolean active_status)
{
    boolean result = FALSE;
#ifdef RUNNING_IN_RASPBERRY
    digitalWrite(active_gpio, active_status);
    delay(1);
    if(digitalRead(active_gpio) == active_status)
#endif
    {
        result = TRUE;
    }
    
    return result;
}


