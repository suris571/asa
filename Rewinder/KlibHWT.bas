Attribute VB_Name = "TVicLib"
Public ActiveHW As Boolean     ' Treiber gestartet Flag
Public HW32 As Long            ' Handle für device driver
Public PORTADR As Long            ' Port-Daten Adresse

Public Declare Function mciExecute Lib "winmm.dll" (ByVal lpstrCommand As String) As Long

'*******************************************************************************
'*******************************************************************************
'                 Kolter-DLL Deklarationen fuer KlibDrv.DLL
'                     (c) Copyright by KOLTER ELECTRONIC
'                          nur für Windows NT / 2000
'*******************************************************************************
'*******************************************************************************

Public Type TDmaBufferRequest
       LengthOfBuffer As Long ' Length in Bytes
       AlignMask      As Long ' 0-4K, 1-8K, 3-16K, 7-32K, $0F-64K, $1F-128K
       PhysDmaAddress As Long ' returned physical address of DMA buffer
       LinDmaAddress  As Long ' returned linear address
       DmaMemHandle   As Long ' returned memory handle (do not use and keep it!)
       KernelDmaAddress As Long ' do not use and keep it!
End Type

'-------------------------------------
'---  Win32 API functions ------------
'-------------------------------------

Public Declare Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (Destination As Any, Source As Any, ByVal Length As Long)

'-------------------------------------
'----------- Common Group ------------
'-------------------------------------

Public Declare Function OpenTVicHW32 Lib "KlibDrv.dll" _
                                     (ByVal HW32 As Long, _
                                      ByVal ServiceName As String, _
                                      ByVal EntryPoint As String) As Long
                                      
' Aufruf:HW32 = OpenTVicHW32(HW32, "KLIBDRV", "KLIBDevice0") oder
'        HW32 = OpenTVicHW32(HW32, "KLIBDRV", "KLIBDevice1")

Public Declare Function CloseTVicHW32 Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Function GetActiveHW Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long

'-------------------------------------
'--------- Port I/O Group ------------
'-------------------------------------
Public Declare Sub SetHardAccess Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal HardAccess As Long)
Public Declare Function GetHardAccess Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Function GetPortByte Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal PortAddr As Long) As Byte
Public Declare Function GetPortWord Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal PortAddr As Long) As Integer
Public Declare Sub SetPortByte Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal PortAddr As Long, ByVal nNewValue As Byte)
Public Declare Sub SetPortWord Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal PortAddr As Long, ByVal nNewValue As Integer)
Public Declare Sub SetPortLong Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal PortAddr As Long, ByVal nNewValue As Long)
Public Declare Function GetPortLong Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal PortAddr As Long) As Long
Public Declare Sub ReadPortFIFO Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef pBuffer As Any)
Public Declare Sub ReadPortWFIFO Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef pBuffer As Any)
Public Declare Sub ReadPortLFIFO Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef pBuffer As Any)
Public Declare Sub WritePortFIFO Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef pBuffer As Any)
Public Declare Sub WritePortWFIFO Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef pBuffer As Any)
Public Declare Sub WritePortLFIFO Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef pBuffer As Any)

'------------------ Memory Group  -----------------
Public Declare Function MapPhysToLinear Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal PhAddr As Long, ByVal nNewValue As Long) As Long
Public Declare Sub UnmapMemory Lib "KlibDrv.dll" (ByVal HW32 As Long, PhAddr As Long)
Public Declare Function GetMemByte Lib "KlibDrv.dll" Alias "GetMem" (ByVal HW32 As Long, ByVal MappedAddr As Long, ByVal Offset As Long) As Byte
Public Declare Sub SetMemByte Lib "KlibDrv.dll" Alias "SetMem" (ByVal HW32 As Long, ByVal MappedAddr As Long, ByVal Offset As Long, ByVal nNewValue As Byte)
Public Declare Function GetMemW Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal MappedAddr As Long, ByVal Offset As Long) As Integer
Public Declare Sub SetMemW Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal MappedAddr As Long, ByVal Offset As Long, ByVal nNewValue As Integer)
Public Declare Function GetMemL Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal MappedAddr As Long, ByVal Offset As Long) As Long
Public Declare Sub SetMemL Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal MappedAddr As Long, ByVal Offset As Long, ByVal nNewValue As Long)

'-------------------------- IRQ Group  -----------------
Public Declare Function IsIRQMasked Lib "KlibDrv.dll" (ByVal HW32 As Long, IrqNumber As Integer) As Long
Public Declare Sub UnmaskIRQ Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal IrqNumber As Integer, ByVal lpHWHandler As Long)
Public Declare Sub MaskIRQ Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal IrqNumber As Integer)
Public Declare Function GetIRQCounter Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal IrqNumber As Integer) As Long

'-------------------------- Keyboard Group  -----------------
Public Declare Sub PutScanCode Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal scan_code As Byte)
Public Declare Function GetScanCode Lib "KlibDrv.dll" (ByVal HW32 As Long) As Byte
Public Declare Sub HookKeyboard Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal KbdHandler As Long)
Public Declare Sub UnhookKeyboard Lib "KlibDrv.dll" (ByVal HW32 As Long)
Public Declare Sub PulseKeyboard Lib "KlibDrv.dll" (ByVal HW32 As Long)
Public Declare Sub PulseKeyboardLocal Lib "KlibDrv.dll" (ByVal HW32 As Long)

'-------------------- LPT port Group -------------
Public Declare Sub SetLPTReadMode Lib "KlibDrv.dll" (ByVal HW32 As Long)
Public Declare Sub SetLPTWriteMode Lib "KlibDrv.dll" (ByVal HW32 As Long)
Public Declare Function IsLPTAcquired Lib "KlibDrv.dll" (ByVal HW32 As Long, LPTNumber As Integer) As Integer
Public Declare Function AcquireLPT Lib "KlibDrv.dll" (ByVal HW32 As Long, LPTNumber As Integer) As Integer
Public Declare Sub ReleaseLPT Lib "KlibDrv.dll" (ByVal HW32 As Long, LPTNumber As Integer)
Public Declare Function GetLPTNumber Lib "KlibDrv.dll" (ByVal HW32 As Long) As Byte
Public Declare Sub SetLPTNumber Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal nNewValue As Byte)
Public Declare Function GetLPTNumPorts Lib "KlibDrv.dll" (ByVal HW32 As Long) As Byte
Public Declare Function GetLPTBasePort Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Function GetPin Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal nPin As Byte) As Long
Public Declare Sub SetPin Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal nPin As Byte, ByVal bNewValue As Long)
Public Declare Function GetLPTAckwl Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Function GetLPTBusy Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Function GetLPTPaperEnd Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Function GetLPTSlct Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Function GetLPTError Lib "KlibDrv.dll" (ByVal HW32 As Long) As Long
Public Declare Sub LPTInit Lib "KlibDrv.dll" (ByVal HW32 As Long)
Public Declare Sub LPTSlctIn Lib "KlibDrv.dll" (ByVal HW32 As Long)
Public Declare Sub LPTStrobe Lib "KlibDrv.dll" (ByVal HW32 As Long)
Public Declare Sub LPTAutofd Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal Flag As Long)
Public Declare Sub ForceIrqLPT Lib "KlibDrv.dll" (ByVal HW32 As Long, ByVal IrqEnable As Long)

Public Declare Function GetLastPciBus Lib "KlibDrv.dll" (ByVal HW32 As Long) As Integer
Public Declare Function GetHardwareMechanism Lib "KlibDrv.dll" (ByVal HW32 As Long) As Integer
Public Declare Function GetPciDeviceInfo Lib "KlibDrv.dll" _
                                        (ByVal HW32 As Long, _
                                         ByVal bus As Integer, _
                                         ByVal Device As Integer, _
                                         ByVal Fun As Integer, _
                                         ByRef CfgInfo As Any) As Long
                                                                                  
'============================
'== DMA Buffer allocation
'============================
Public Declare Function GetSysDmaBuffer Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef Buf As TDmaBufferRequest) As Boolean
Public Declare Function GetBusmasterDmaBuffer Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef Buf As TDmaBufferRequest) As Boolean
Public Declare Sub FreeDmaBuffer Lib "KlibDrv.dll" (ByVal HW32 As Long, ByRef Buf As TDmaBufferRequest)
Public mComPort As Integer
Public mParity As String
Public mBaudrate As String
Public mStopbit As String
Public Function HexToInt(ByVal strMyString As String) As Long
  Dim lngMyInteger As Long
  lngMyInteger = 0
  On Error Resume Next
  lngMyInteger = "&h" & strMyString
  HexToInt = lngMyInteger
End Function
Public Function IntToHex2(ByVal MyVal As Byte) As String
  Dim s As String
  s = Hex(MyVal)
  If Len(s) = 1 Then s = "0" & s
  IntToHex2 = s
End Function
Public Function IntToHex4(ByVal MyVal As Integer) As String
  Dim s As String
  s = Hex(MyVal)
  While Len(s) < 4
    s = "0" & s
  Wend
  IntToHex4 = s
End Function

Public Function IntToHex8(ByVal MyVal As Long) As String
  Dim s As String
  s = Hex(MyVal)
  While Len(s) < 8
    s = "0" & s
  Wend
  IntToHex8 = s
End Function

