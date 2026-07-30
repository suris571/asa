VERSION 5.00
Object = "{648A5603-2C6E-101B-82B6-000000000014}#1.1#0"; "MSCOMM32.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form frmCarIn 
   BorderStyle     =   1  'Fixed Single
   Caption         =   "ชั่งรถเข้า"
   ClientHeight    =   4845
   ClientLeft      =   4950
   ClientTop       =   3585
   ClientWidth     =   5250
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   4845
   ScaleWidth      =   5250
   Begin VB.Timer Timer1 
      Interval        =   1000
      Left            =   4350
      Top             =   1020
   End
   Begin MSCommLib.MSComm MSComm1 
      Left            =   3285
      Top             =   900
      _ExtentX        =   1005
      _ExtentY        =   1005
      _Version        =   393216
      DTREnable       =   -1  'True
      Handshaking     =   1
      BaudRate        =   2400
      ParitySetting   =   2
      DataBits        =   7
   End
   Begin VB.CommandButton cmdGetWeight 
      Caption         =   "&รับน้ำหนัก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   495
      Left            =   3855
      TabIndex        =   17
      Top             =   3480
      Width           =   1200
   End
   Begin VB.TextBox txtWeight 
      Alignment       =   1  'Right Justify
      BackColor       =   &H00E0E0E0&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   14.25
         Charset         =   222
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   495
      Left            =   2100
      TabIndex        =   16
      Top             =   3480
      Width           =   1695
   End
   Begin VB.CommandButton cmdCancel 
      Caption         =   "&ยกเลิก"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   435
      Left            =   2805
      TabIndex        =   12
      Top             =   4185
      Width           =   825
   End
   Begin VB.CommandButton cmdSave 
      Caption         =   "&บันทึก"
      Default         =   -1  'True
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   222
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   435
      Left            =   1665
      TabIndex        =   3
      Top             =   4185
      Width           =   825
   End
   Begin VB.Frame Frame1 
      Height          =   1815
      Left            =   135
      TabIndex        =   6
      Top             =   1470
      Width           =   4950
      Begin VB.TextBox txtCarID 
         Height          =   300
         Left            =   4440
         TabIndex        =   13
         Top             =   285
         Visible         =   0   'False
         Width           =   375
      End
      Begin VB.ComboBox cboCarType 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   420
         Left            =   1815
         TabIndex        =   2
         Top             =   1215
         Width           =   2505
      End
      Begin VB.TextBox txtDeliveryStaff 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   420
         Left            =   1815
         TabIndex        =   1
         Top             =   720
         Width           =   2505
      End
      Begin VB.ComboBox cboCarNo 
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   12
            Charset         =   222
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   420
         Left            =   1815
         TabIndex        =   0
         Top             =   225
         Width           =   2505
      End
      Begin VB.Label Label6 
         Alignment       =   1  'Right Justify
         Caption         =   "ประเภทรถ :*"
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
         Left            =   330
         TabIndex        =   10
         Top             =   1245
         Width           =   1380
      End
      Begin VB.Label Label5 
         Alignment       =   1  'Right Justify
         Caption         =   "ชื่อผู้ส่ง :*"
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
         Left            =   735
         TabIndex        =   9
         Top             =   750
         Width           =   975
      End
      Begin VB.Label Label4 
         Alignment       =   1  'Right Justify
         Caption         =   "ทะเบียนรถ :*"
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
         Left            =   315
         TabIndex        =   8
         Top             =   255
         Width           =   1395
      End
   End
   Begin MSMask.MaskEdBox txtDateIn 
      Height          =   420
      Left            =   870
      TabIndex        =   15
      Top             =   975
      Width           =   1995
      _ExtentX        =   3519
      _ExtentY        =   741
      _Version        =   393216
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
   Begin VB.Label Label8 
      Caption         =   "น้ำหนักรถเปล่า :*"
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
      Left            =   180
      TabIndex        =   14
      Top             =   3555
      Width           =   1830
   End
   Begin VB.Label Label7 
      BackColor       =   &H80000016&
      Height          =   630
      Left            =   135
      TabIndex        =   11
      Top             =   4110
      Width           =   4950
   End
   Begin VB.Label Label3 
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
      Height          =   315
      Left            =   165
      TabIndex        =   7
      Top             =   1020
      Width           =   690
   End
   Begin VB.Label Label2 
      Alignment       =   2  'Center
      BackStyle       =   0  'Transparent
      Caption         =   "รถเข้า"
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
      Height          =   600
      Left            =   165
      TabIndex        =   5
      Top             =   105
      Width           =   1245
   End
   Begin VB.Label Label1 
      BackColor       =   &H00C00000&
      Height          =   795
      Left            =   -45
      TabIndex        =   4
      Top             =   0
      Width           =   5385
   End
End
Attribute VB_Name = "frmCarIn"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub cboCarNo_LostFocus()
Dim Rs As New ADODB.Recordset
Dim Sql As String
    
    Sql = "select c.id, s.first_name || ' ' || s.last_name delivery_staff, c.car_type " & _
            " from tp_car c " & _
            " inner join staff s on s.id=c.staff_id " & _
            " where car_no='" & cboCarNo.Text & "'"
    Rs.Open Sql, conn
    
    If Rs.BOF = False And Rs.EOF = False Then
        txtCarID = Rs!Id
        txtDeliveryStaff = Rs!delivery_staff
        cboCarType = Rs!car_type
    Else
        txtCarID = ""
    End If
    
    Rs.Close
    Set Rs = Nothing
End Sub



Private Sub cboCarType_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub cmdCancel_Click()
    Call ClearForm
End Sub

Private Sub cmdGetWeight_Click()
    Dim KPos As String
    Dim PPos As String
    Dim varWeight As String
    
    'txtWeight = 1000 'ใช้สำหรับทดสอบนะครับ
    
    varWeight = MSComm1.Input

   If InStr(varWeight, "k") = 0 Then
        Me.MousePointer = vbDefault
        cmdGetWeight.Enabled = True
        Exit Sub

    End If

    KPos = InStrRev(varWeight, "k")                             'หาตำแหน่งของตัว k โดยเริ่มจากท้าย
    PPos = InStrRev(varWeight, "+", KPos) + 1         'หาตำแหน่งของเครื่องหมาย + โดยนับจากท้าย โดยเริ่มจากตำแหน่งของตัว k

    txtWeight = Val(Trim(Mid(varWeight, PPos, KPos - PPos)))         'ตัด String จากท้าย แล้วเก็บค่าเข้าตัวแปร

    DoEvents

End Sub

Private Sub cmdSave_Click()
'ตรวจสอบค่าว่าง
    If Trim(cboCarNo) = "" Then
        MsgBox "กรุณาเลือกทะเบียนรถ", vbOKOnly + vbExclamation, "ทะเบียนรถ"
        cboCarNo.SetFocus
        Exit Sub
    End If
    
    If Trim(txtDeliveryStaff) = "" Then
        MsgBox "กรุณาระบุชื่อผู้ส่ง", vbOKOnly + vbExclamation, "ชื่อผู้ส่ง"
        Call txtFocus(txtDeliveryStaff)
        Exit Sub
    End If
    
    If Trim(cboCarType) = "" Then
        MsgBox "กรุณาเลือกประเภทรถ", vbOKOnly + vbExclamation, "ประเภทรถ"
        cboCarType.SetFocus
        Exit Sub
    End If
    
    'txtWeight = 1100
    If Trim(txtWeight) = "" Then
        MsgBox "กรุณารับน้ำหนัก", vbOKOnly + vbExclamation, "น้ำหนักรถเปล่า"
        cmdGetWeight.SetFocus
        Exit Sub
    End If
    
'ตรวจสอบค่าซ้ำ
    Dim RsDup As New ADODB.Recordset
    Dim SqlDup As String
    
    SqlDup = "select id from tp_car_weight" & _
                " where tp_car_no='" & cboCarNo & "' and date_out is null"
    RsDup.Open SqlDup, conn
    
    If RsDup.BOF = False And RsDup.EOF = False Then
        MsgBox "รถทะเบียน " & cboCarNo & " รอชั่งออก", vbOKOnly + vbInformation, "รถรอชั่งออก"
        cboCarNo.SetFocus
        Exit Sub
    End If
    
'insert
    Dim SqlInsert As String
    
    SqlInsert = "INSERT INTO TP_CAR_WEIGHT (ID, CREATE_DATE, CREATE_STAFF, " & _
                        " TP_CAR_ID, TP_CAR_NO, WEIGHT_BEFOR, " & _
                        " DATE_IN,  DELIVERY_STAFF, CAR_TYPE) " & _
                        " values(sq_tp_car_weight.nextval, sysdate, " & staffID & ", " & _
                        IIf(txtCarID = "", "null", txtCarID) & ",'" & cboCarNo & "', " & txtWeight & "," & _
                        " sysdate,'" & txtDeliveryStaff & "', '" & cboCarType & "')"
    
    conn.Execute SqlInsert
    
    MsgBox "บันทึกข้อมูลเรียบร้อย", vbOKOnly + vbInformation, "บันทึก"
    
    Call ClearForm
    
End Sub

Private Sub Form_Load()
    txtDateIn = getDateNow
    Call AddCarNo
    Call AddCarType
    Call OpenCommPort
End Sub
Private Sub OpenCommPort()
    MSComm1.Settings = "2400,N,7,1"         'สำหรับ AKPC
    'MSComm1.Settings = "115200,N,8,1"    'สำหรับทดสอบ
    MSComm1.Handshaking = comXOnXoff
    
    If MSComm1.PortOpen = False Then      'ถ้าปิดอยู่ก็ให้เปิดซะ
        MSComm1.PortOpen = True  'เปิด Comport
    End If
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
'    txtWeight = Val(Trim(Mid(varWeight, PPos, KPos - PPos)))         'ตัด String จากท้าย แล้วเก็บค่าเข้าตัวแปร
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
    txtDateIn = getDateNow
End Sub

Private Sub txtDateIn_GotFocus()
    If Len(Trim(txtDateIn)) > 0 Then
        txtDateIn.SelStart = 0
        txtDateIn.SelLength = Len(txtDateIn)
    End If
End Sub

Private Sub txtDateIn_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub AddCarNo()
    Dim Rs As New ADODB.Recordset
    Dim Sql As String
    
    Sql = "select car_no from tp_car order by car_no"
    Rs.Open Sql, conn
    
    Do While Not Rs.EOF
        cboCarNo.AddItem Rs!car_no
        Rs.MoveNext
    Loop
End Sub

Private Sub AddCarType()
    cboCarType.AddItem "รถ 6 ล้อ"
    cboCarType.AddItem "รถ 10 ล้อ"
    cboCarType.AddItem "รถ 10 ล้อพ่วง"
    cboCarType.AddItem "รถเทรนเลอร์"
End Sub

Private Sub txtDeliveryStaff_GotFocus()
    Call txtFocus(txtDeliveryStaff)
End Sub

Private Sub txtWeight_KeyPress(KeyAscii As Integer)
    KeyAscii = 0
End Sub

Private Sub ClearForm()
    txtDateIn = getDateNow
    cboCarNo = ""
    txtCarID = ""
    txtDeliveryStaff = ""
    cboCarType = ""
    txtWeight = ""
End Sub
