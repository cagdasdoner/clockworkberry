#include <stdio.h>
#include <string.h>

#include "include/global.h"
#include "include/porting_DS1620.h"
#include "include/porting_gpio.h"
#include "include/porting_window.h"

#define SERVER_TO_RASP          "write.sock"
#define RASP_TO_SERVER          "read.sock"
#define SOCK_BUF_LEN            64
#define SOCK_TCP_BACKLOG        10
#define TEMP_THREAD_DELAY       5 * 60 * 1000

#define MAX_ITEM_DATA_LEN       6
#define MAX_ITEM_TYPE_STR_LEN   3
#define PARSING_CMD_CNT         6

#define CONTINUOUS_TEMP_READ    TRUE

typedef struct
{
    Message type;
    char typeStr[MAX_ITEM_TYPE_STR_LEN + 1];
    unsigned short int id;
    char data[MAX_ITEM_DATA_LEN + 1];
    boolean initialize;
    boolean timer;
    unsigned short int interval;
}ControlItem;

boolean sent_to_server(char * data);
boolean message_composer(ControlItem *item, char* composed_str);

#ifdef RUNNING_IN_RASPBERRY

PI_THREAD (temperature_thread)
{
    char t_data[MAX_ITEM_DATA_LEN + 1] = {0};
    char local_t_data[MAX_ITEM_DATA_LEN + 1] = {0};
    ControlItem item;
    item.id = 1;
    memset(item.typeStr, 0, MAX_ITEM_TYPE_STR_LEN);
    sprintf(item.typeStr, "%s", "TMP");
    item.initialize = 0;
    item.timer = 0;
    item.interval = 0;
    char composing_str[SOCK_BUF_LEN] = {0};
    bzero(t_data, sizeof(t_data));

    while(1) 
    {
        sprintf(t_data, TEMP_READ_FORMAT, Read_DS1620_Temp());
        if(strncmp(t_data, local_t_data, strlen(t_data)) != 0 || CONTINUOUS_TEMP_READ)
        {
            printf("TEMP : %s\n", t_data);
            memset(item.data, 0, MAX_ITEM_DATA_LEN);
            sprintf(item.data, "%s", t_data);
            message_composer(&item, composing_str);
            sent_to_server(composing_str);
        }
        strncpy(local_t_data, t_data, strlen(t_data));
        /* Minimal value of sensor reading on Error cases */
        if(strncmp(t_data, INCORRECT_READING, strlen(t_data)) == 0)
        {
            printf("Error on temp reading! Re-initing..\n");
            Local_Init();
        }
        delay(TEMP_THREAD_DELAY);
    }
    
    return 0;
}
#endif


boolean sent_to_server(char * data)
{
    boolean result = FALSE;
    int sock;
    struct sockaddr_un server;
    
    sock = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sock < 0) 
    {
        perror("Error on opening stream socket!");
    }
    else
    {
        server.sun_family = AF_UNIX;
        strcpy(server.sun_path, RASP_TO_SERVER);
        
        if (connect(sock, (struct sockaddr *) &server, sizeof(struct sockaddr_un)) < 0) 
        {
            perror("Error on connecting stream socket!");
        }
        else
        {
            if (write(sock, data, strlen(data)) < 0)
            {
                perror("Error on writing on stream socket!");
            }
            else
            {
                result = TRUE;
            }
        }
        close(sock);
    }
    
    return result;
}

boolean message_composer(ControlItem *item, char* composed_str)
{
    boolean retval = TRUE;
    memset(composed_str, 0, SOCK_BUF_LEN);
    sprintf(composed_str, "type=%s,id=%hu,data=%s,initialize=%u,timer=%u,interval=%hu", 
        item->typeStr, item->id, item->data, item->initialize, item->timer, item->interval);
    
    return retval;
}

boolean message_parser(char* buf, ControlItem *item)
{
    unsigned short int parsing_cmd_cnt = 0;
    boolean sanityCheck = FALSE;
    char tempbuf[SOCK_BUF_LEN];
    strncpy(tempbuf, buf, strlen(buf) + 1);
    const char s[2] = ",";
    char *token;
    token = strtok(tempbuf, s);
    
    while( token != NULL ) 
    {
        if(strncmp("type", token, strlen("type")) == 0)
        {
            sscanf(token, "type=%s", item->typeStr);
            item->typeStr[MAX_ITEM_TYPE_STR_LEN] = 0;
            parsing_cmd_cnt++;
        }
        else if(strncmp("id", token, strlen("id")) == 0)
        {
            sscanf(token, "id=%hu", &item->id);
            parsing_cmd_cnt++;
        }
        else if(strncmp("data", token, strlen("data")) == 0)
        {
            sscanf(token, "data=%s", item->data);
            item->data[MAX_ITEM_DATA_LEN] = 0;
            parsing_cmd_cnt++;
        }
        else if(strncmp("initialize", token, strlen("initialize")) == 0)
        {
            sscanf(token, "initialize=%u", &item->initialize);
            parsing_cmd_cnt++;
        }
        else if(strncmp("timer", token, strlen("timer")) == 0)
        {
            sscanf(token, "timer=%u", &item->timer);
            parsing_cmd_cnt++;
        }
        else if(strncmp("interval", token, strlen("interval")) == 0)
        {
            sscanf(token, "interval=%hu", &item->interval);
            parsing_cmd_cnt++;
        }
        token = strtok(NULL, s);
    }
    
    if(item->typeStr != NULL && (0 < item->id < MAX_ITEM_COUNT) && item->data != NULL 
        && (FALSE <= item->initialize <= TRUE) && (FALSE <= item->timer <= TRUE) /* && INTERVAL */)
    {
        sanityCheck = TRUE;
    }

    return ((parsing_cmd_cnt == PARSING_CMD_CNT) && sanityCheck) ? TRUE : FALSE;
}

void message_dispatcher(char* buf)
{
    ControlItem item;
    memset(&item, 0, sizeof(item));
    char composing_str[SOCK_BUF_LEN] = {0};
    
    if(message_parser(buf, &item))
    {
        if(strncmp(item.typeStr, "SPR", MAX_ITEM_TYPE_STR_LEN) == 0)
        {
            if(item.timer)
            {
                /* Switch type as not a timer to make a normal non-timer item request to raspian. */
                item.timer = FALSE;
                if(strncmp(item.data, "ST:OP", MAX_ITEM_DATA_LEN) == 0)
                {
                    memset(item.data, 0, MAX_ITEM_DATA_LEN);
                    sprintf(item.data, "%u", LOW);
                    if(perform_gpio_operation(get_sprinkler_gpio(item.id), LOW))
                    {
                        message_composer(&item, composing_str);
                        sent_to_server(composing_str);
                    }
                }
                else
                {
                    memset(item.data, 0, MAX_ITEM_DATA_LEN);
                    sprintf(item.data, "%u", HIGH);
                    if(perform_gpio_operation(get_sprinkler_gpio(item.id), HIGH))
                    {
                        message_composer(&item, composing_str);
                        sent_to_server(composing_str);
                    }
                }
            }
            else if(item.initialize)
            {
                memset(item.data, 0, MAX_ITEM_DATA_LEN);
                sprintf(item.data, "%u", get_sprinkler_status(item.id));
                message_composer(&item, composing_str);
                sent_to_server(composing_str);
            }
            else
            {
                boolean active_voltage = LOW;
                if(sscanf(item.data, "%u", &active_voltage) == FALSE)
                {
                    printf("ERROR : Voltage cannot be read from sprinkler data.\n");
                }
                else
                {
                    if(perform_gpio_operation(get_sprinkler_gpio(item.id), active_voltage))
                    {
                        message_composer(&item, composing_str);
                        sent_to_server(composing_str);
                    }
                    else
                    {
                        printf("ERROR : Sprinkler GPIO cannot be set!\n");
                    }
                }
            }
        }
        else if(strncmp(item.typeStr, "LMP", MAX_ITEM_TYPE_STR_LEN) == 0)
        {
            if(item.timer)
            {
                /* Switch type as not a timer to make a normal non-timer item request to raspian. */
                item.timer = FALSE;
                if(strncmp(item.data, "ST:OP", MAX_ITEM_DATA_LEN) == 0)
                {
                    memset(item.data, 0, MAX_ITEM_DATA_LEN);
                    sprintf(item.data, "%u", LOW);
                    if(perform_gpio_operation(get_lamp_gpio(item.id), LOW))
                    {
                        message_composer(&item, composing_str);
                        sent_to_server(composing_str);
                    }
                }
                else
                {
                    memset(item.data, 0, MAX_ITEM_DATA_LEN);
                    sprintf(item.data, "%u", HIGH);
                    if(perform_gpio_operation(get_lamp_gpio(item.id), HIGH))
                    {
                        message_composer(&item, composing_str);
                        sent_to_server(composing_str);
                    }
                }
            }
            else if(item.initialize)
            {
                memset(item.data, 0, MAX_ITEM_DATA_LEN);
                sprintf(item.data, "%u", get_lamp_status(item.id));
                message_composer(&item, composing_str);
                sent_to_server(composing_str);
            }
            else
            {
                boolean active_voltage = LOW;
                if(sscanf(item.data, "%u", &active_voltage) == FALSE)
                {
                    printf("ERROR : Voltage cannot be read from lamp data.\n");
                }
                else
                {
                    if(perform_gpio_operation(get_lamp_gpio(item.id), active_voltage))
                    {
                        message_composer(&item, composing_str);
                        sent_to_server(composing_str);
                    }
                    else
                    {
                        printf("ERROR : Lamp GPIO cannot be set!\n");
                    }
                }
            }
        }
        else if(strncmp(item.typeStr, "WND", MAX_ITEM_TYPE_STR_LEN) == 0)
        {
            Action window_action = IDLE;
            if(strncmp(item.data, "UP", MAX_ITEM_DATA_LEN) == 0)
            {
                window_action = UP;
            }
            else if(strncmp(item.data, "DOWN", MAX_ITEM_DATA_LEN) == 0)
            {
                window_action = DOWN;
            }
            else if(strncmp(item.data, "STOP", MAX_ITEM_DATA_LEN) == 0)
            {
                window_action = STOP;
            }
            
            if(perform_window_action(item.id, window_action))
            {
                message_composer(&item, composing_str);
                sent_to_server(composing_str);
            }
            else
            {
                printf("ERROR : Window action cannot be completed!\n");
            }
        }
        else if(strncmp(item.typeStr, "TMP", MAX_ITEM_TYPE_STR_LEN) == 0)
        {
            if(item.initialize)
            {
                memset(item.data, 0, MAX_ITEM_DATA_LEN);
                sprintf(item.data, TEMP_READ_FORMAT, Read_DS1620_Temp());
                message_composer(&item, composing_str);
                sent_to_server(composing_str);
            }
        }
        else
        {
            printf("ERROR : Invalid item type!\n");
        }
    }
}

/* May server.c start working after server.js. Be sync. Just a protection. */
boolean prepare_and_send_initials()
{
    boolean result = TRUE;
    boolean pin_status = TRUE;
    unsigned short int index = 0;
    ControlItem item;
    char composing_str[SOCK_BUF_LEN] = {0};

    for(index = FIRST_LAMP_ID; index <= MAX_LAMP_COUNT; index++)
    {
        item.id = index;
        memset(item.data, 0, MAX_ITEM_DATA_LEN);
        sprintf(item.data, "%d", get_lamp_status(item.id));
        memset(item.typeStr, 0, MAX_ITEM_TYPE_STR_LEN);
        sprintf(item.typeStr, "%s", "LMP");
        item.initialize = 1;
        item.timer = 0;
        item.interval = 0;
        message_composer(&item, composing_str);
        result &= sent_to_server(composing_str);
    }
    
    for(index = FIRST_SPRINKLER_ID; index <= MAX_SPRINKLER_COUNT; index++)
    {
        item.id = index;
        memset(item.data, 0, MAX_ITEM_DATA_LEN);
        sprintf(item.data, "%d", get_sprinkler_status(item.id));
        memset(item.typeStr, 0, MAX_ITEM_TYPE_STR_LEN);
        sprintf(item.typeStr, "%s", "SPR");
        item.initialize = 1;
        item.timer = 0;
        item.interval = 0;
        message_composer(&item, composing_str);
        result &= sent_to_server(composing_str);
    }
    
    for(index = FIRST_TEMPSENSOR_ID; index <= MAX_TEMPSENSOR_COUNT; index++)
    {
        item.id = index;
        memset(item.data, 0, MAX_ITEM_DATA_LEN);
        sprintf(item.data, TEMP_READ_FORMAT, Read_DS1620_Temp());
        memset(item.typeStr, 0, MAX_ITEM_TYPE_STR_LEN);
        sprintf(item.typeStr, "%s", "TMP");
        item.initialize = 1;
        item.timer = 0;
        item.interval = 0;
        message_composer(&item, composing_str);
        result &= sent_to_server(composing_str);
    }
    
    return result;
}

int main()
{
    int sock_r, msgsock, rval;
    struct sockaddr_un server_r;
    char buf[SOCK_BUF_LEN];
    unsigned int counter = 0;
    
#ifdef RUNNING_IN_RASPBERRY
    if(init_gpio() == -1)
    {
        printf("No wiring pi detected!\n");
        return 0;
    }
#ifdef TEMPERATURE_SENSING_IS_ACTIVE
    Local_Init();
    delay(2000);
    piThreadCreate (temperature_thread);
#endif
#endif

    sock_r = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sock_r < 0) 
    {
        perror("Error on opening stream socket!");
        exit(1);
    }

    server_r.sun_family = AF_UNIX;
    strcpy(server_r.sun_path, SERVER_TO_RASP);

    if (bind(sock_r, (struct sockaddr *) &server_r, sizeof(struct sockaddr_un))) 
    {
        perror("Error on binding socket!");
        exit(1);
    }

    printf("Socket_r has name %s\n", server_r.sun_path);
    listen(sock_r, SOCK_TCP_BACKLOG);
    
    if(!prepare_and_send_initials())
    {
        printf("STATUS: Web Server is not active probably, but he is able to cover himself.\n");
    }
    
    printf("Waiting for data...\n");
    
    for (;;) 
    {
        msgsock = accept(sock_r, 0, 0);
        if (msgsock == -1)
        {
            perror("Error on accepting socket conn!");
        }
        else
        {
            do
            {
                bzero(buf, sizeof(buf));
                if((rval = read(msgsock, buf, SOCK_BUF_LEN)) < 0)
                {
                    perror("Error on reading stream payload!");
                }
                else if(rval == 0)
                {
                    counter++;
                    printf("Ending connection...%d times message received since first run...\n", counter);
                }
                else
                {
                    printf("RASPBERRY SOCK READ: %s\n", buf);
                    message_dispatcher(buf);
                }
            }
            while (rval > 0);
        }
        close(msgsock);
    }
    close(sock_r);
    unlink(SERVER_TO_RASP);
}

