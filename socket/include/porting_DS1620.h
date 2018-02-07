#ifndef PORTING_DS1620_H
#define PORTING_DS1620_H

#define     DS1620_CLK          0       /* DS1620 clock line*/
#define     DS1620_DQ           2       /* DS1620 data  line*/
#define     DS1620_RST          3       /* DS1620 reset line*/

#define     INCORRECT_READING   "-60.0"
#define     TEMP_READ_FORMAT    "%2.1f"

unsigned char    Get_DS1620_Byte( void );
unsigned char    Read_DS1620_Byte( void );
void  Put_DS1620_Byte(unsigned char m);
void  Write_DS1620_Byte(unsigned char m);
void  Init_DS1620 (void);
void  Start_DS1620_Convertion (void);
float Read_DS1620_Temp(void);
void Local_Init(void);

#endif
