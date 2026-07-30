VERSION 5.00
Object = "{648A5603-2C6E-101B-82B6-000000000014}#1.1#0"; "MSCOMM32.OCX"
Object = "{67397AA1-7FB1-11D0-B148-00A0C922E820}#6.0#0"; "msadodc.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{CDE57A40-8B86-11D0-B3C6-00A0C90AEA82}#1.0#0"; "MSDATGRD.OCX"
Begin VB.Form frmCarOut 
   BackColor       =   &H80000014&
   BorderStyle     =   1  'Fixed Single
   Caption         =   "ชั่งรถออก"
   ClientHeight    =   7770
   ClientLeft      =   1890
   ClientTop       =   1905
   ClientWidth     =   12255
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   7770
   ScaleWidth      =   12255
   Begin VB.Frame Frame3 
      BackColor       =   &H00C0C0C0&
      Height          =   6855
      Left            =   7920
      TabIndex        =   20
      Top             =   840
      Width           =   4200
      Begin VB.TextBox txtCWrID 
         Height          =   360
         Left            =   660
         TabIndex        =   27
         Top             =   3135
         Visible         =   0   'False
         Width           =   600
      End
      Begin MSDataGridLib.DataGrid dgCarList 
         Height          =   5010
         Left            =   75
         TabIndex        =   21
         Top             =   795
         Width           =   4050
         _ExtentX        =   7144
         _ExtentY        =   8837
         _Version        =   393216
         AllowUpdate     =   0   'False
         BackColor       =   16777215
         HeadLines       =   1
         RowHeight       =   19
         FormatLocked    =   -1  'True
         BeginProperty HeadFont {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Caption         =   "รายการรถชั่งออกประจำวันที่"
         ColumnCount     =   5
         BeginProperty Column00 
            DataField       =   "id"
            Caption         =   "id"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   0
               Format          =   "hh:mm"
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   0
            EndProperty
         EndProperty
         BeginProperty Column01 
            DataField       =   "time_out"
            Caption         =   "เวลา"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   1
               Format          =   "hh:mm"
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   4
            EndProperty
         EndProperty
         BeginProperty Column02 
            DataField       =   "tp_car_no"
            Caption         =   "ทะเบียนรถ"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   0
               Format          =   ""
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   0
            EndProperty
         EndProperty
         BeginProperty Column03 
            DataField       =   "weight_befor"
            Caption         =   "นน.ชั่งเข้า"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   1
               Format          =   "#,##0"
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   1
            EndProperty
         EndProperty
         BeginProperty Column04 
            DataField       =   "weight_after"
            Caption         =   "นน.ชั่งออก"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   1
               Format          =   "#,##0"
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   1
            EndProperty
         EndProperty
         SplitCount      =   1
         BeginProperty Split0 
            BeginProperty Column00 
               ColumnWidth     =   0
            EndProperty
            BeginProperty Column01 
               Alignment       =   2
               ColumnWidth     =   645.165
            EndProperty
            BeginProperty Column02 
               Alignment       =   2
               ColumnWidth     =   1005.165
            EndProperty
            BeginProperty Column03 
               Alignment       =   1
               ColumnWidth     =   900.284
            EndProperty
            BeginProperty Column04 
               Alignment       =   1
               ColumnWidth     =   900.284
            EndProperty
         EndProperty
      End
      Begin VB.CommandButton cmdReprint 
         Caption         =   "พิมพ์ซ้ำ"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   14.25
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   600
         Left            =   1320
         TabIndex        =   26
         Top             =   6120
         Width           =   1590
      End
      Begin MSAdodcLib.Adodc Adodc2 
         Height          =   375
         Left            =   420
         Top             =   3045
         Visible         =   0   'False
         Width           =   1665
         _ExtentX        =   2937
         _ExtentY        =   661
         ConnectMode     =   0
         CursorLocation  =   3
         IsolationLevel  =   -1
         ConnectionTimeout=   15
         CommandTimeout  =   30
         CursorType      =   3
         LockType        =   3
         CommandType     =   8
         CursorOptions   =   0
         CacheSize       =   50
         MaxRecords      =   0
         BOFAction       =   0
         EOFAction       =   0
         ConnectStringType=   1
         Appearance      =   1
         BackColor       =   -2147483643
         ForeColor       =   -2147483640
         Orientation     =   0
         Enabled         =   -1
         Connect         =   ""
         OLEDBString     =   ""
         OLEDBFile       =   ""
         DataSourceName  =   ""
         OtherAttributes =   ""
         UserName        =   ""
         Password        =   ""
         RecordSource    =   ""
         Caption         =   "Adodc2"
         BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         _Version        =   393216
      End
      Begin VB.CommandButton cmdSearchBillNo 
         Caption         =   "&ค้นหา"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   450
         Left            =   3135
         TabIndex        =   24
         Top             =   195
         Width           =   885
      End
      Begin VB.TextBox txtSearchBillNo 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   14.25
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   450
         Left            =   1395
         TabIndex        =   23
         Top             =   195
         Width           =   1680
      End
      Begin VB.Label Label15 
         BackColor       =   &H80000013&
         BackStyle       =   0  'Transparent
         Caption         =   "*เลือกที่รายการแล้วกดปุ่มพิมพ์ซ้ำเพื่อพิมพ์ใบรถ"
         ForeColor       =   &H000000C0&
         Height          =   285
         Left            =   480
         TabIndex        =   25
         Top             =   5880
         Width           =   3450
      End
      Begin VB.Label Label14 
         BackStyle       =   0  'Transparent
         Caption         =   "ใบส่งของ :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   345
         Left            =   210
         TabIndex        =   22
         Top             =   255
         Width           =   1185
      End
   End
   Begin VB.CommandButton cmdPrint 
      Caption         =   "พิมพ์"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   600
      Left            =   360
      TabIndex        =   13
      Top             =   7035
      Width           =   2190
   End
   Begin MSCommLib.MSComm MSComm1 
      Left            =   0
      Top             =   0
      _ExtentX        =   1005
      _ExtentY        =   1005
      _Version        =   393216
      DTREnable       =   -1  'True
      Handshaking     =   1
      BaudRate        =   2400
      ParitySetting   =   2
      DataBits        =   7
   End
   Begin VB.CommandButton cmdCancel 
      Caption         =   "ยกเลิก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   600
      Left            =   6120
      TabIndex        =   12
      Top             =   7035
      Width           =   1590
   End
   Begin VB.CommandButton cmdSave 
      Caption         =   "บันทึก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   600
      Left            =   4080
      TabIndex        =   11
      Top             =   7035
      Width           =   1710
   End
   Begin VB.Frame Frame2 
      BackColor       =   &H80000014&
      Height          =   1800
      Left            =   120
      TabIndex        =   6
      Top             =   5160
      Width           =   7575
      Begin VB.CommandButton cmdGetWeight 
         BackColor       =   &H80000014&
         Caption         =   "รับน้ำหนัก"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   24
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   1290
         Left            =   225
         TabIndex        =   10
         Top             =   300
         Width           =   2190
      End
      Begin VB.Label txtWeightOut 
         Alignment       =   1  'Right Justify
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   4560
         TabIndex        =   16
         Top             =   1200
         Width           =   2055
      End
      Begin VB.Label txtNetWeight 
         Alignment       =   1  'Right Justify
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   4560
         TabIndex        =   17
         Top             =   720
         Width           =   2055
      End
      Begin VB.Label txt_diff 
         Alignment       =   1  'Right Justify
         BackColor       =   &H8000000B&
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   4560
         TabIndex        =   15
         Top             =   240
         Width           =   2055
      End
      Begin VB.Label Label13 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000014&
         Caption         =   "ผลต่าง :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   2745
         TabIndex        =   14
         Top             =   225
         Width           =   1545
      End
      Begin VB.Label Label12 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000014&
         Caption         =   "น้ำหนักชั่งออก :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   2640
         TabIndex        =   9
         Top             =   1200
         Width           =   1650
      End
      Begin VB.Label Label11 
         BackColor       =   &H80000014&
         Caption         =   "Kg."
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   6960
         TabIndex        =   8
         Top             =   795
         Width           =   405
      End
      Begin VB.Label Label10 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000014&
         Caption         =   "น้ำหนักสุทธิ :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   2745
         TabIndex        =   7
         Top             =   735
         Width           =   1545
      End
   End
   Begin VB.Timer Timer1 
      Interval        =   1000
      Left            =   600
      Top             =   0
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000009&
      Height          =   4335
      Left            =   120
      TabIndex        =   2
      Top             =   840
      Width           =   7575
      Begin VB.TextBox txtCountRoll 
         Alignment       =   1  'Right Justify
         BackColor       =   &H8000000F&
         BorderStyle     =   0  'None
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   4560
         TabIndex        =   36
         Top             =   3840
         Width           =   945
      End
      Begin VB.TextBox txtSumWeight 
         Alignment       =   1  'Right Justify
         BackColor       =   &H8000000F&
         BorderStyle     =   0  'None
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   5535
         TabIndex        =   35
         Top             =   3840
         Width           =   1065
      End
      Begin VB.TextBox txtCarNo 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   480
         Left            =   2280
         TabIndex        =   31
         Top             =   240
         Width           =   1755
      End
      Begin VB.TextBox txtCwID 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   465
         Left            =   4080
         TabIndex        =   30
         Top             =   255
         Visible         =   0   'False
         Width           =   465
      End
      Begin MSDataGridLib.DataGrid dgTrans 
         Height          =   1680
         Left            =   240
         TabIndex        =   28
         Top             =   2040
         Width           =   7095
         _ExtentX        =   12515
         _ExtentY        =   2963
         _Version        =   393216
         AllowUpdate     =   0   'False
         ColumnHeaders   =   -1  'True
         HeadLines       =   1
         RowHeight       =   19
         FormatLocked    =   -1  'True
         BeginProperty HeadFont {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ColumnCount     =   7
         BeginProperty Column00 
            DataField       =   "id"
            Caption         =   "id"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   0
               Format          =   ""
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   0
            EndProperty
         EndProperty
         BeginProperty Column01 
            DataField       =   "tp_car_no"
            Caption         =   "tp_car_no"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   0
               Format          =   ""
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   0
            EndProperty
         EndProperty
         BeginProperty Column02 
            DataField       =   "trans_roll_no"
            Caption         =   "เลขที่ใบขึ้น"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   0
               Format          =   ""
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   0
            EndProperty
         EndProperty
         BeginProperty Column03 
            DataField       =   "cust_code"
            Caption         =   "ลูกค้า"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   0
               Format          =   ""
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   0
            EndProperty
         EndProperty
         BeginProperty Column04 
            DataField       =   "sp_place"
            Caption         =   "สถานที่ส่ง"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   0
               Format          =   ""
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   0
            EndProperty
         EndProperty
         BeginProperty Column05 
            DataField       =   "roll_qty"
            Caption         =   "จำนวนม้วน"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   1
               Format          =   "#,##0"
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   1
            EndProperty
         EndProperty
         BeginProperty Column06 
            DataField       =   "roll_weight"
            Caption         =   "น้ำหนักรวม"
            BeginProperty DataFormat {6D835690-900B-11D0-9484-00A0C91110ED} 
               Type            =   1
               Format          =   "#,##0"
               HaveTrueFalseNull=   0
               FirstDayOfWeek  =   0
               FirstWeekOfYear =   0
               LCID            =   1054
               SubFormatType   =   1
            EndProperty
         EndProperty
         SplitCount      =   1
         BeginProperty Split0 
            BeginProperty Column00 
               Alignment       =   2
               ColumnWidth     =   0
            EndProperty
            BeginProperty Column01 
               ColumnWidth     =   0
            EndProperty
            BeginProperty Column02 
               Alignment       =   2
               ColumnWidth     =   1200.189
            EndProperty
            BeginProperty Column03 
               Alignment       =   2
               ColumnWidth     =   1200.189
            EndProperty
            BeginProperty Column04 
               Alignment       =   2
               ColumnWidth     =   1995.024
            EndProperty
            BeginProperty Column05 
               Alignment       =   1
               ColumnWidth     =   1005.165
            EndProperty
            BeginProperty Column06 
               Alignment       =   1
               ColumnWidth     =   1005.165
            EndProperty
         EndProperty
      End
      Begin MSMask.MaskEdBox txtDateOut 
         Height          =   420
         Left            =   5400
         TabIndex        =   32
         Top             =   240
         Width           =   1980
         _ExtentX        =   3493
         _ExtentY        =   741
         _Version        =   393216
         BackColor       =   -2147483633
         MaxLength       =   16
         BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Mask            =   "##/##/#### ##:##"
         PromptChar      =   "_"
      End
      Begin VB.Label Label3 
         BackColor       =   &H80000014&
         Caption         =   "วันที่ :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   285
         Left            =   4680
         TabIndex        =   34
         Top             =   285
         Width           =   645
      End
      Begin VB.Label Label4 
         BackColor       =   &H80000014&
         Caption         =   "ทะเบียนรถ :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   18
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   405
         Left            =   240
         TabIndex        =   33
         Top             =   285
         Width           =   1875
      End
      Begin VB.Label Label8 
         Alignment       =   2  'Center
         BackColor       =   &H8000000E&
         Caption         =   "รวม"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   3720
         TabIndex        =   29
         Top             =   3840
         Width           =   675
      End
      Begin VB.Label txtDeliveryStaff 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   2280
         TabIndex        =   19
         Top             =   1080
         Width           =   5055
      End
      Begin VB.Label txtWeightBefore 
         Alignment       =   1  'Right Justify
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   375
         Left            =   2280
         TabIndex        =   18
         Top             =   1560
         Width           =   1815
      End
      Begin VB.Label Label7 
         BackColor       =   &H80000014&
         Caption         =   "Kg."
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   4200
         TabIndex        =   5
         Top             =   1545
         Width           =   480
      End
      Begin VB.Label Label6 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000014&
         Caption         =   "น้ำหนักรถเปล่า :"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   360
         TabIndex        =   4
         Top             =   1545
         Width           =   1740
      End
      Begin VB.Label Label5 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000014&
         Caption         =   "ชื่อผู้ส่ง :  "
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   330
         Left            =   960
         TabIndex        =   3
         Top             =   1080
         Width           =   1305
      End
   End
   Begin MSAdodcLib.Adodc Adodc1 
      Height          =   345
      Left            =   480
      Top             =   3525
      Visible         =   0   'False
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   609
      ConnectMode     =   0
      CursorLocation  =   3
      IsolationLevel  =   -1
      ConnectionTimeout=   15
      CommandTimeout  =   30
      CursorType      =   3
      LockType        =   3
      CommandType     =   8
      CursorOptions   =   0
      CacheSize       =   50
      MaxRecords      =   0
      BOFAction       =   0
      EOFAction       =   0
      ConnectStringType=   1
      Appearance      =   1
      BackColor       =   -2147483643
      ForeColor       =   -2147483640
      Orientation     =   0
      Enabled         =   -1
      Connect         =   ""
      OLEDBString     =   ""
      OLEDBFile       =   ""
      DataSourceName  =   ""
      OtherAttributes =   ""
      UserName        =   ""
      Password        =   ""
      RecordSource    =   ""
      Caption         =   "Adodc1"
      BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      _Version        =   393216
   End
   Begin VB.Label Label2 
      BackStyle       =   0  'Transparent
      Caption         =   "รถออก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   24
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H8000000F&
      Height          =   510
      Left            =   5160
      TabIndex        =   1
      Top             =   45
      Width           =   1440
   End
   Begin VB.Label Label1 
      BackColor       =   &H8000000C&
      Height          =   780
      Left            =   0
      TabIndex        =   0
      Top             =   -45
      Width           =   12450
   End
End
Attribute VB_Name = "frmCarOut"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False






Private Sub cmdCancel_Click()
    Call ClearForm
End Sub

Private Sub cmdGetWeight_Click()
    Dim KPos As String
    Dim PPos As String
    Dim varWeight As String
    
'   txtWeightOut = 90000       'ใช้สำหรับทดสอบครับ
    
   varWeight = MSComm1.Input

   If InStr(varWeight, "k") = 0 Then
        Me.MousePointer = vbDefault
        cmdGetWeight.Enabled = True
        Exit Sub

    End If

    KPos = InStrRev(varWeight, "k")                             'หาตำแหน่งของตัว k โดยเริ่มจากท้าย
    PPos = InStrRev(varWeight, "+", KPos) + 1         'หาตำแหน่งของเครื่องหมาย + โดยนับจากท้าย โดยเริ่มจากตำแหน่งของตัว k

    txtWeightOut = Format(Val(Trim(Mid(varWeight, PPos, KPos - PPos))), "#,###")         'ตัด String จากท้าย แล้วเก็บค่าเข้าตัวแปร
    If Trim(txtWeightOut.Caption) = "" Then
        txtWeightOut.Caption = 0
    End If
    
    If Trim(txtWeightBefore.Caption) = "" Then
        txtWeightBefore.Caption = 0
    End If
    
    If Trim(txtSumWeight.Text) = "" Then
        txtSumWeight.Text = 0
    End If
    txt_diff.Caption = Format(CDbl(txtSumWeight.Text) - (CDbl(txtWeightOut.Caption) - CDbl(txtWeightBefore.Caption)), "#,###")

    If IsNull(txt_diff.Caption) Then
        txt_diff.Caption = 0
    End If
    txtNetWeight.Caption = Format(CDbl(txtWeightOut.Caption) - CDbl(txtWeightBefore.Caption), "#,###")

    DoEvents

End Sub

Private Sub cmdPrint_Click()
Dim IE As New InternetExplorer

If txtCwID = "" Or Val(txtCwID) = 0 Then
    MsgBox "ข้อมูลรถยังไม่บันทึก", vbOKOnly + vbExclamation, "Save"
    cmdPrint.SetFocus
    Exit Sub
End If

'แสดง Report ทางเว็บ
    'IE.Visible = True
    'IE.Navigate ("http://akpcappserv/reports/rwservlet?userid=AKPC/GVG8RU:U@AKPC&report=tp_car_show.rdf&destype=Cache&desformat=pdf&paramform=no&varCwID=" & txtCwID)

'แสดงข้อมูลออกเครื่องปริ้นท์
    DERoll.Command2 txtCarNo
    DRCarWeight.PrintReport
    DERoll.rsCommand2.Close

End Sub

Private Sub cmdReprint_Click()
    DERoll.Command2 txtCWrID
    DRCarWeight.PrintReport
    DERoll.rsCommand2.Close
End Sub

Private Sub cmdSave_Click()
    
    'ตรวจสอบค่าว่าง
    If Trim(txtCarNo) = "" Then
        MsgBox "กรุณาระบุทะเบียนรถที่ขึ้นของแล้ว", vbOKOnly + vbExclamation, "ทะเบียนรถ"
        Call txtFocus(txtCarNo)
        Exit Sub
    End If
    
    'txtWeightOut = 11000
    If Trim(txtWeightOut) = "" Then
        MsgBox "กรุณารับน้ำหนัก", vbOKOnly + vbExclamation, "รับน้ำหนัก"
        cmdGetWeight.SetFocus
        Exit Sub
    End If
    
    'บันทึกน้ำหนักรถออก
    Dim SqlUpdate As String
    'replace comma before insert to DB
    txtWeightOut = Replace(txtWeightOut, ",", "")
    
    SqlUpdate = "update tp_car_weight" & _
                        " set weight_after=" & txtWeightOut & ", date_out=sysdate" & _
                        " where id=" & txtCwID
    conn.Execute SqlUpdate
    
    MsgBox "บันทึกข้อมูลเรียบร้อย", vbOKOnly + vbInformation, "Save Success"
    
    DERoll.Command2 Val(txtCwID.Text)
    DRCarWeight.PrintReport
    DERoll.rsCommand2.Close
    
    Call ClearForm
    Call SetCarListToday
End Sub
Private Sub ClearForm()
    txtCarNo = ""
    txtCwID = ""
    txtDateOut = getDateNow
    txtDeliveryStaff = ""
    txtWeightBefore = ""
    txtCountRoll = ""
    txtSumWeight = ""
    txtNetWeight = ""
    txtWeightOut = ""
    txt_diff = ""
    
    Set dgTrans.DataSource = Nothing
    dgTrans.Refresh
    dgCarList.Refresh
End Sub

Private Sub cmdSearchBillNo_Click()

Dim RsTransNo As New ADODB.Recordset
Dim RsTransCarWaitOut As New ADODB.Recordset
Dim RsCarOut As New ADODB.Recordset

Dim SqlTransCarWaitOut As String
Dim SqlCarOut As String

    RsTransNo.Open "select id From tp_trans_roll where trans_roll_no='" & txtSearchBillNo & "'", conn
    If RsTransNo.BOF And RsTransNo.EOF Then
        MsgBox "เลขที่ใบส่งของไม่ถูกต้อง", vbOKOnly + vbExclamation, "Data Not Found"
        txtSearchBillNo.SelStart = 0
        txtSearchBillNo.SelLength = Len(txtSearchBillNo)
        Exit Sub
    Else
        SqlTransCarWaitOut = "select tw.id " & _
                                                " from tp_car_weight tw, tp_trans_roll tr " & _
                                                " Where tw.Id = tr.tp_car_weight_id " & _
                                                " and tr.trans_roll_no='" & txtSearchBillNo & "' " & _
                                                " and tw.weight_after is not null"
        RsTransCarWaitOut.Open SqlTransCarWaitOut, conn
        If RsTransCarWaitOut.BOF And RsTransCarWaitOut.EOF Then
            MsgBox "รถกำลังรอชั่งออก", vbOKOnly + vbExclamation, "No Data Found"
            txtSearchBillNo.SelStart = 0
            txtSearchBillNo.SelLength = Len(txtSearchBillNo)
            Exit Sub

        Else
            SqlCarOut = "select tw.id, to_char(tw.date_out,'hh24:mi') time_out," & _
                                    " tw.tp_car_no, tw.weight_befor,tw.weight_after " & _
                                    " from tp_car_weight tw, tp_trans_roll tr " & _
                                    " Where tw.Id = tr.tp_car_weight_id " & _
                                    " and tr.trans_roll_no='" & txtSearchBillNo & "' " & _
                                    " and tw.weight_after is not null"
            RsCarOut.Open SqlCarOut, conn
            
            Adodc2.RecordSource = SqlCarOut
            Adodc2.Refresh
            
            Set dgCarList.DataSource = Adodc2
            dgCarList.Refresh
            
            dgCarList.Caption = "รายการรถตามใบส่งของเลขที่ : " & txtSearchBillNo

        End If
    End If
End Sub

Private Sub dgCarList_RowColChange(LastRow As Variant, ByVal LastCol As Integer)
On Error GoTo dgCarList_RowColChange_Err:
    txtCWrID = Adodc2.Recordset.Fields("id")
    
dgCarList_RowColChange_Err:
If Err.Number = 3021 Then
    
End If
End Sub

Private Sub Form_Load()
    txtDateOut = getDateNow
    
    Adodc1.ConnectionString = txtConn
    Adodc2.ConnectionString = txtConn
    
    Call OpenCommPort
    Call SetCarListToday
    
End Sub
Private Sub OpenCommPort()
    MSComm1.Settings = "2400,N,7,1"         'สำหรับ AKPC
    'MSComm1.Settings = "115200,N,8,1"    'สำหรับทดสอบ
    MSComm1.Handshaking = comXOnXoff
    
    If MSComm1.PortOpen = False Then      'ถ้าปิดอยู่ก็ให้เปิดซะ
         MSComm1.PortOpen = True  'เปิด Comport
    End If
End Sub
Private Sub SetCarListToday()
Dim Sql As String
Dim Rs As New ADODB.Recordset

    Sql = "select tw.id, to_char(tw.date_out,'hh24:mi') time_out,tw.tp_car_no,  tw.weight_befor, tw.weight_after" & _
                " from tp_car_weight tw " & _
                " where to_char(tw.date_out,'dd/mm/yyyy')=to_char(sysdate,'dd/mm/yyyy') " & _
                " order by to_char(tw.date_out,'hh24:mi') desc "
    Rs.Open Sql, conn
    
    Adodc2.RecordSource = Sql
    Adodc2.Refresh
    
    Set dgCarList.DataSource = Adodc2
    dgCarList.Refresh
    
    dgCarList.Caption = dgCarList.Caption & " " & Format(getDateNow, "dd/mm/yyyy")

End Sub

Private Sub Form_Unload(Cancel As Integer)
    If MSComm1.PortOpen = True Then
        MSComm1.PortOpen = False
    End If
    
    frmCarWeightMenu.Show
End Sub

Private Sub MSComm1_OnComm()
On Error GoTo MSComm1_OnComm_Err:

Dim KPos As String
Dim PPos As String
Dim varWeight As String
    
'    varWeight = MSComm1.Input
''         MsgBox varWeight
'   If InStr(varWeight, "k") = 0 Then
'        Me.MousePointer = vbDefault
'        cmdGetWeight.Enabled = True
'        Exit Sub
'
'    End If
'
'    KPos = InStrRev(varWeight, "k")                             'หาตำแหน่งของตัว k โดยเริ่มจากท้าย
'    PPos = InStrRev(varWeight, "+", KPos) + 1         'หาตำแหน่งของเครื่องหมาย + โดยนับจากท้าย โดยเริ่มจากตำแหน่งของตัว k
'
'    txtWeightOut.Text = Val(Trim(Mid(varWeight, PPos, KPos - PPos)))         'ตัด String จากท้าย แล้วเก็บค่าเข้าตัวแปร
'    DoEvents
'
'    Me.MousePointer = vbDefault
'    cmdGetWeight.Enabled = True
'    'MSComm1.PortOpen = False  'ปิด Comport
'
'    Exit Sub
    
MSComm1_OnComm_Err:
If Err.Number <> 0 Then
    MsgBox Err.Description, vbOKOnly + vbExclamation, "Error"
    Exit Sub
End If

End Sub

Private Sub Timer1_Timer()
    txtDateOut = getDateNow
End Sub

Private Sub txtCarNo_KeyPress(KeyAscii As Integer)
    Dim Sql As String
    Dim SqlSum As String
    Dim Rs As New ADODB.Recordset
    Dim RsSum As New ADODB.Recordset
    If KeyAscii = 13 Then
        KeyAscii = 0
        
        Sql = "select tr.id, tr.trans_roll_no, c.cust_code, tr.sp_place, " & _
                    " count(r.id) roll_qty, sum(r.weight_trans) roll_weight, cw.tp_car_no ," & _
                    " cw.id cw_id, cw.delivery_staff, cw.weight_befor" & _
                    " from tp_trans_roll tr, customer c, tp_trans_roll_detail trd, " & _
                    " st_bring_roll br , st_stock st, pd_roll r, tp_car_weight cw " & _
                    " Where tr.customer_id = c.Id And trd.tp_trans_roll_id = tr.Id " & _
                    " and trd.st_bring_roll_id=br.id and br.st_stock_id=st.id " & _
                    " and st.pd_roll_id=r.id and tr.tp_car_weight_id=cw.id " & _
                    " and cw.weight_after is null  and cw.tp_car_no='" & txtCarNo & "'" & _
                    " group by tr.id, tr.trans_roll_no, c.cust_code, tr.sp_place, cw.tp_car_no, " & _
                    " cw.id, cw.delivery_staff, cw.weight_befor"
        Rs.Open Sql, conn
        
        If Rs.BOF = True And Rs.BOF = True Then
            MsgBox "ไม่พบข้อมูล", vbOKOnly + vbInformation, "รถออก"
            txtCarNo.SetFocus
            Exit Sub
        Else
        
            txtCwID = Rs!cw_id
            txtDeliveryStaff = Rs!delivery_staff
            txtWeightBefore = Format(Rs!weight_befor, "#,###")
        
            SqlSum = "select sum(rs.roll_qty) countRoll, sum(rs.roll_weight) sumWeight " & _
                            " From ( " & Sql & ") rs"
            RsSum.Open SqlSum, conn
        
            txtCountRoll = RsSum!countroll
            txtSumWeight = Format(RsSum!sumweight, "#,###")
            
        
            Adodc1.RecordSource = Sql
            Adodc1.Refresh
            
            Set dgTrans.DataSource = Adodc1
            dgTrans.Refresh
        End If
        
    End If
End Sub

Private Sub txtCountRoll_GotFocus()
    'txtFocus (txtCountRoll)
End Sub

Private Sub txtCountRoll_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtDateOut_GotFocus()
    txtDateOut.SetFocus
    txtDateOut.SelStart = 0
    txtDateOut.SelLength = Len(txtDateOut)
End Sub

Private Sub txtDateOut_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtDeliveryStaff_GotFocus()
    'txtFocus (txtDeliveryStaff)
End Sub

Private Sub txtDeliveryStaff_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtSearchBillNo_KeyPress(KeyAscii As Integer)
    If KeyAscii = 13 Then
        cmdSearchBillNo_Click
    End If
    
End Sub

Private Sub txtSumWeight_GotFocus()
    'txtFocus (txtSumWeight)
End Sub

Private Sub txtSumWeight_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub txtWeightBefore_GotFocus()
    'txtFocus (txtWeightBefore)
End Sub

Private Sub txtWeightBefore_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub
