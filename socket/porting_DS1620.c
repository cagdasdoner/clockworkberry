#include "include/global.h"
#include "include/porting_DS1620.h"

#ifdef RUNNING_IN_RASPBERRY
void Init_DS1620 (void)
{
    digitalWrite(DS1620_RST, 1);
    delay(1);
    Put_DS1620_Byte(0x0C);
    Put_DS1620_Byte(0x02);                   /* set to CPU & continuous mode */
    digitalWrite(DS1620_RST, 0);
    delay(30);
    
    digitalWrite(DS1620_RST, 1);
    Put_DS1620_Byte(0x22);                    /* stop convert (ie reset) */
    digitalWrite(DS1620_RST, 0);
    delay(100);
}

void Start_DS1620_Convertion (void)
{
    digitalWrite(DS1620_RST, 1);
    Put_DS1620_Byte(0xEE);                      /* start temp convert    */
    digitalWrite(DS1620_RST, 0);
}

unsigned char Get_DS1620_Byte( void )
{
    unsigned char j,k=0,b=1;
    delay(1);
    for (j=0; j<8; j++)
    {
        digitalWrite(DS1620_CLK, 0);
        delay(1);
        pinMode(DS1620_DQ, INPUT);
        if (digitalRead(DS1620_DQ)) 
            k|=b;                             /* Read bit and or if = 1     */
        pinMode(DS1620_DQ, OUTPUT);
        digitalWrite(DS1620_CLK, 1);
        delay(1);
        b=(b<<1);                             /* Setup for next read and or */
    }
    return k;
}

/*----------------------------------------------------------------------*/
/*   Put temp from DS1620                                            */
/*----------------------------------------------------------------------*/
void  Put_DS1620_Byte(unsigned char m)
{
    unsigned char k,b=1,bit;
    delay(1);
    digitalWrite(DS1620_RST, 1);
    delay(1);
    for (k=0; k<8; k++)
    {
        bit = (m & b);
        bit = (bit>>k);
        digitalWrite(DS1620_CLK, 0);
        delay(1);
        digitalWrite(DS1620_DQ, bit);  /* Send bit to 1620   */
        delay(1);
        digitalWrite(DS1620_CLK, 1);
        delay(1);
        b=(b<<1);                              /* Setup to send next bit  */
    }
    return;
}

/*----------------------------------------------------------------------*/
/*      read temp from DS1620                                           */
/*----------------------------------------------------------------------*/

unsigned char Read_DS1620_Byte( void )
{
    unsigned char j,k=0,b=1;
    delay(1);
    for (j=0; j<10; j++)
    {
        digitalWrite(DS1620_CLK, 0);
        delay(1);
        pinMode(DS1620_DQ, INPUT);
        if (digitalRead(DS1620_DQ))
            k|=b;                              /* Read bit and or if = 1  */
        pinMode(DS1620_DQ, OUTPUT);
        digitalWrite(DS1620_CLK, 1);
        delay(1);
        b=(b<<1);                              /* Setup for next read and or */
    }
    return k;
}

/*----------------------------------------------------------------------*/
/*      write temp from DS1620                                          */
/*----------------------------------------------------------------------*/
void  Write_DS1620_Byte(unsigned char m)
{
    unsigned char k,b=1,bit;
    delay(1);
    digitalWrite(DS1620_RST, 1);
    delay(1);
    for (k=0; k<10; k++)
    {
        bit = (m & b);
        bit = (bit>>k);
        digitalWrite(DS1620_CLK, 0);
        delay(1);
        digitalWrite(DS1620_DQ, bit); /* Send bit to 1620     */
        delay(1);
        digitalWrite(DS1620_CLK, 1);
        delay(1);
        b=(b<<1);                                /* Setup to send next bit */
    }
    return;
}

/*----------------------------------------------------------------------*/
/*      Prepare to Read Data from apps                                       */
/*----------------------------------------------------------------------*/
void Local_Init()
{
    pinMode(DS1620_CLK, OUTPUT);
    pinMode(DS1620_DQ, OUTPUT);
    pinMode(DS1620_RST, OUTPUT);
    
    Init_DS1620();
    Start_DS1620_Convertion();
}
#endif


float Read_DS1620_Temp(void)
{
#ifdef RUNNING_IN_RASPBERRY
    unsigned char temp_and_half_bit,sign_bit;
    unsigned short  count_remain,count_per_c;
    float temp_read,temp_c;
    
    digitalWrite(DS1620_RST, 1);
    delay(1);
    Put_DS1620_Byte(0xAA);                       /* read temp command       */
    temp_and_half_bit = Get_DS1620_Byte();       /* read 1st byte of temp   */
    sign_bit = Get_DS1620_Byte();                /* read 2nd byte of temp   */
    digitalWrite(DS1620_RST, 0);
    delay(1);
    
/*----------------------------------------------------------------------*/
/*      Get count remain & count per C for .1 resolution                */
/*----------------------------------------------------------------------*/

    digitalWrite(DS1620_RST, 1);
    delay(1);
    Put_DS1620_Byte(0xA0);                           /* read count remaining  */
    count_remain = Get_DS1620_Byte();                /* read 1st byte         */
    count_remain += Get_DS1620_Byte() * 256;         /* read 2nd byte         */
    digitalWrite(DS1620_RST, 0);
    delay(1);

    digitalWrite(DS1620_RST, 1);
    delay(1);
    Put_DS1620_Byte(0xA9);                           /* read slope as count/c */
    count_per_c = Get_DS1620_Byte();                 /* read 1st byte         */
    count_per_c += Get_DS1620_Byte() * 256;          /* read 2nd byte         */
    digitalWrite(DS1620_RST, 0);
    delay(1);
    /*----------------------------------------------------------------------*/
    /*      Calculate Celcius and Fahrenheight                              */
    /*----------------------------------------------------------------------*/
    if ( count_per_c == 0 )
        count_per_c = 1;

        temp_read = ( temp_and_half_bit >> 1 );
       
    if ( sign_bit != 0 ) 
        temp_read = (temp_read - 128);

        temp_c = (float)temp_read-0.25 + (count_per_c-count_remain)/(float) count_per_c;
        //temp_f = temp_c * 9/5 + 32;  /*Fahrenheight value*/
        
        return temp_c;
#else
	return 22.5;
#endif
}
