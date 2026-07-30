VERSION 5.00
Object = "{648A5603-2C6E-101B-82B6-000000000014}#1.1#0"; "MSCOMM32.OCX"
Begin VB.Form frmTestPrint 
   Caption         =   "Form1"
   ClientHeight    =   4290
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   6150
   LinkTopic       =   "Form1"
   ScaleHeight     =   4290
   ScaleWidth      =   6150
   StartUpPosition =   3  'Windows Default
   Begin VB.TextBox Text1 
      Height          =   1950
      Left            =   300
      MultiLine       =   -1  'True
      TabIndex        =   1
      Top             =   1665
      Width           =   5490
   End
   Begin MSCommLib.MSComm MSComm2 
      Left            =   1365
      Top             =   675
      _ExtentX        =   1005
      _ExtentY        =   1005
      _Version        =   393216
      CommPort        =   2
      DTREnable       =   -1  'True
      OutBufferSize   =   406
      BaudRate        =   110
   End
   Begin VB.CommandButton cmdTestPrint 
      Caption         =   "Test Print"
      Height          =   480
      Left            =   2085
      TabIndex        =   0
      Top             =   735
      Width           =   1500
   End
End
Attribute VB_Name = "frmTestPrint"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim SndLine1 As String
Dim SndLine2 As String
Dim HW32 As Long            ' Handle für device driver
Dim ActiveHW As Boolean     ' Treiber gestartet Flag
Dim PORTADR As Long            ' Port-Daten Adresse
Dim SndText As String
Dim Line1 As String
Dim Line2 As String
Dim Line3 As String
Dim maxCol As Integer
Dim waitTime As Integer

Private Sub StartPort()
    ActiveHW = False
    HW32 = 0
    HW32 = OpenTVicHW32(HW32, "KLIBDRV", "KLIBDevice0")
    ActiveHW = GetActiveHW(HW32)
    If Not ActiveHW Then
       'Call MsgBox("Can't open the driver!", 0, "Warning!")
       CloseTVicHW32 (HW32)
       'End
       'Exit Sub
    End If
    OffRelay
    
    If MSComm2.PortOpen = True Then
       MSComm2.PortOpen = False
    End If
     MSComm2.PortOpen = True

End Sub

Private Sub cmdTestPrint_Click()
    Dim mDate As String
    Dim mYear As String
    Dim mCriteria As String
    Dim a As String
    Dim b As String
    Dim c As Integer
    Dim x As Integer
    Dim msr As String
    Dim result As Variant
    
   Call StartPort
    
    maxCol = 19
    Line1 = "CA125A-070707"
        c = (maxCol - Len(Line1)) / 2
       If c > 0 Then Line1 = Space(c) & Line1
                
    Line2 = "2-A-207123456K1"
        c = Int((maxCol - Len(Line2)) / 2)
    
       If c > 0 Then Line2 = Space(c) & Line2
                
    Line3 = "45-88IN.-1234KG."
        x = Int((maxCol - Len(Line3)) / 2)
        
       If x > 0 Then Line3 = Space(x) & Line3
           
        SndLine1 = vbCrLf & Chr(12) & Trim(Line1) & Chr(12) & vbCrLf & vbCrLf & Trim(Line2) & vbCrLf
         
         SndLine2 = vbCrLf & Trim(Line3) & vbCrLf

    Text1.Text = UCase(SndLine1 & SndLine2)
    Call SendData
End Sub
Private Sub SendData()
Dim sTime As Date

     MSComm2.Output = Chr(4) 'Clear input buffer ล้างข้อมูลในเครื่องพิมพ์
     'MSComm1.Output = strSend  'Send Data ส่งข้อมูลออกทาง Serial Com2 ,baud rate 110
     MSComm2.Output = SndLine1
     sTime = Time
     Do While sTime = Time
     Loop
     MSComm2.Output = SndLine2
     MSComm2.Output = Chr(1) 'สั่งให้เครื่งพิมพ์ พิมพ์ข้อมูลที่อยู่ใน Buffers
     MSComm2.Output = Chr(2) 'Read Input Buffers
     OnOffRelay  'ปิดเปิด Relay เพื่อให้ส่วนควบคุมมอเตอร์หัวพิมพ์ทำงานเลื่อนหัวพิมพ์ลง

     SndText = SndLine1 & SndLine2


End Sub

Private Sub OnOffRelay()
     PORTADR = &HF300
     Call SetPortWord(HW32, PORTADR, &HF)

     'Label3.Caption = "Relay On"
     While waitTime < 5
         DoEvents
         Debug.Print waitTime
     Wend
     OffRelay
     'Label3.Caption = "Relay Off"
     Cls
End Sub
Private Sub OffRelay()
     PORTADR = &HF300
     Call SetPortWord(HW32, PORTADR, &H0)
End Sub

