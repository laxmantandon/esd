declare namespace Tremol {
	declare interface FP {
		timeStamp: number;
		/**
		 * Programs the customer DB for special customer receipt issuing.
		 */
		AddNewHScode(HS_Code: string, HS_Name: string, OptionTaxable: Tremol.Enums.OptionTaxable, MesureUnit: string, VAT_rate: number): void;
		/**
		 * Available only if the receipt is not closed. Cancel all sales in the receipt and close it .
		 */
		CancelReceipt(): void;
		/**
		 * Clears the external display.
		 */
		ClearDisplay(): void;
		/**
		 * Closes the opened fiscal receipt and returns receipt info.
		 */
		CloseReceipt(): CloseReceiptRes;
		/**
		 * Confirm PIN number.
		 */
		ConfirmFiscalization(Password: string): void;
		/**
		 * Provides information for the daily fiscal report  with zeroing and fiscal memory record, preceded by Electronic Journal report.
		 */
		DailyReport(): void;
		/**
		 * Executes the direct command .
		 */
		DirectCommand(Input: string): string;
		/**
		 * Shows the current date and time on the external display.
		 */
		DisplayDateTime(): void;
		/**
		 * Shows a 20-symbols text in the upper external display line.
		 */
		DisplayTextLine1(Text: string): void;
		/**
		 * Shows a 16-symbols text in the lower external display line.
		 */
		DisplayTextLine2(Text: string): void;
		/**
		 * Shows a 16-symbols text in the first line and last 16-symbols text in the second line of the external display lines.
		 */
		DisplayTextLines1and2(Text: string): void;
		/**
		 * Erase HS codes.
		 */
		EraseHScodes(Password: string): void;
		/**
		 * Informs about the issued document
		 */
		InfoLastReceiptDuplicate(): void;
		/**
		 * Opens a fiscal invoice credit note receipt assigned to the specified operator number and operator password with free info for customer data. The Invoice receipt can be issued only if the invoice range (start and end numbers) is set.
		 */
		OpenCreditNoteWithFreeCustomerData(CompanyName: string, ClientPINnum: string, HeadQuarters: string, Address: string, PostalCodeAndCity: string, ExemptionNum: string, RelatedInvoiceNum: string, TraderSystemInvNum: string): void;
		/**
		 * Opens a fiscal invoice debit note receipt assigned to the specified operator number and operator password with free info for customer data. The Invoice receipt can be issued only if the invoice range (start and end numbers) is set.
		 */
		OpenDebitNoteWithFreeCustomerData(CompanyName: string, ClientPINnum: string, HeadQuarters: string, Address: string, PostalCodeAndCity: string, ExemptionNum: string, RelatedInvoiceNum: string, TraderSystemInvNum: string): void;
		/**
		 * Opens a fiscal invoice receipt assigned to the specified operator number and operator password with free info for customer data. The Invoice receipt can be issued only if the invoice range (start and end numbers) is set.
		 */
		OpenInvoiceWithFreeCustomerData(CompanyName: string, ClientPINnum: string, HeadQuarters: string, Address: string, PostalCodeAndCity: string, ExemptionNum: string, TraderSystemInvNum: string): void;
		/**
		 * Opens a fiscal receipt assigned to the specified operator number and operator password, parameters for receipt format and VAT type.
		 */
		OpenReceipt(OptionReceiptFormat: Tremol.Enums.OptionReceiptFormat, TraderSystemInvNum: string): void;
		/**
		 * Programs HS code at a given position (HS number in order).
		 */
		ProgHScode(HS_Number: number, HS_Code: string, HS_Name: string, OptionTaxable: Tremol.Enums.OptionTaxable, MesureUnit: string, VAT_Rate: number): void;
		/**
		 * Stores a block containing the values of the VAT rates into the CU
		 */
		ProgVATrates(Password: string, VATrateA: number, VATrateB: number, VATrateC: number, VATrateD: number, VATrateE: number): void;
		/**
		 *  Reads raw bytes from FP.
		 */
		RawRead(Count: number, EndChar: string): Uint8Array;
		/**
		 *  Writes raw bytes to FP 
		 */
		RawWrite(Bytes: Uint8Array): void;
		/**
		 * Provides information about the manufacturing number of the CU and PIN number.
		 */
		ReadCUnumbers(): CUnumbersRes;
		/**
		 * Read the current status of the receipt.
		 */
		ReadCurrentReceiptInfo(): CurrentReceiptInfoRes;
		/**
		 * Provides information about the accumulated amounts and refunded amounts by VAT class in case that CU regularly informs about the Z report(7C)
		 */
		ReadDailyAmountsByVAT(): DailyAmountsByVATRes;
		/**
		 * Provides information about the current date and time.
		 */
		ReadDateTime(): Date;
		/**
		 * FlagsModule is a char with bits representing modules supported by the device.
		 */
		ReadDeviceModuleSupport(): DeviceModuleSupportRes;
		/**
		 * FlagsModule is a char with bits representing modules supported by the firmware
		 */
		ReadDeviceModuleSupportByFirmware(): DeviceModuleSupportByFirmwareRes;
		/**
		 * Provides information about device's network IP address, subnet mask, gateway address, DNS address.
		 */
		ReadDeviceTCP_Addresses(OptionAddressType: Tremol.Enums.OptionAddressType): DeviceTCP_AddressesRes;
		/**
		 * Provides information about device's DHCP status
		 */
		ReadDHCP_Status(): Tremol.Enums.OptionDHCPEnabled;
		/**
		 * Provides information about documents sending functions .
		 */
		ReadDiagnostics(): DiagnosticsRes;
		/**
		 * Read whole Electronic Journal report from beginning to the end.
		 */
		ReadEJ(OptionReadEJStorage: Tremol.Enums.OptionReadEJStorage): void;
		/**
		 * Read Electronic Journal Report initial date to report end date.
		 */
		ReadEJByDate(OptionReadEJStorage: Tremol.Enums.OptionReadEJStorage, StartRepFromDate: Date, EndRepFromDate: Date): void;
		/**
		 * Provides information about the accumulated EOD turnover and VAT
		 */
		ReadEODAmounts(): EODAmountsRes;
		/**
		 * Provides information about device's GRPS APN.
		 */
		ReadGPRS_APN(): GPRS_APNRes;
		/**
		 * Read GPRS APN authentication type
		 */
		ReadGPRS_AuthenticationType(): Tremol.Enums.OptionAuthenticationType;
		/**
		 * Provides information about device's GPRS password.
		 */
		ReadGPRS_Password(): GPRS_PasswordRes;
		/**
		 * Providing information about device's GPRS user name.
		 */
		ReadGPRS_Username(): GPRS_UsernameRes;
		/**
		 * Programs HS code at a given position (HS number in order).
		 */
		ReadHScode(HS_Number: number): HScodeRes;
		/**
		 * Read the number of HS codes.
		 */
		ReadHScodeNumber(): number;
		/**
		 * Providing information about server HTTPS address.
		 */
		ReadHTTPS_Server(): HTTPS_ServerRes;
		/**
		 * Provide information from the last communication with the server.
		 */
		ReadInfoFromLastServerCommunication(OptionServerResponse: Tremol.Enums.OptionServerResponse, OptionTransactionType: Tremol.Enums.OptionTransactionType): InfoFromLastServerCommunicationRes;
		/**
		 * Read invoice threshold count
		 */
		ReadInvoice_Threshold(): number;
		/**
		 * Provides information about the number of the last issued receipt.
		 */
		ReadLastAndTotalReceiptNum(): LastAndTotalReceiptNumRes;
		/**
		 * Provides information about device's NTP address.
		 */
		ReadNTP_Address(): NTP_AddressRes;
		/**
		 * Read/Store Invoice receipt copy to External USB Flash memory, External SD card.
		 */
		ReadOrStoreInvoiceCopy(OptionInvoiceCopy: Tremol.Enums.OptionInvoiceCopy, CUInvoiceNum: string): void;
		/**
		 * Read device communication usage with server
		 */
		ReadServer_UsedComModule(): Tremol.Enums.OptionModule;
		/**
		 * Reads specific message number
		 */
		ReadSpecificMessage(MessageNum: string): SpecificMessageRes;
		/**
		 * Provides detailed 6-byte information about the current status of the CU.
		 */
		ReadStatus(): StatusRes;
		/**
		 * Provides information about if the TCP connection autostart when the device enter in Line/Sale mode.
		 */
		ReadTCP_AutoStartStatus(): Tremol.Enums.OptionTCPAutoStart;
		/**
		 * Provides information about device's MAC address.
		 */
		ReadTCP_MACAddress(): string;
		/**
		 * Provides information about device's TCP password.
		 */
		ReadTCP_Password(): TCP_PasswordRes;
		/**
		 * Provides information about which module the device is in use: LAN or WiFi module. This information can be provided if the device has mounted both modules.
		 */
		ReadTCP_UsedModule(): Tremol.Enums.OptionUsedModule;
		/**
		 * Read time threshold minutes
		 */
		ReadTimeThreshold_Minutes(): number;
		/**
		 * Reads all messages from log
		 */
		ReadTotalMessagesCount(): string;
		/**
		 * Provides information about the current VAT rates (the last value stored in FM).
		 */
		ReadVATrates(): VATratesRes;
		/**
		 * Provides information about the device version.
		 */
		ReadVersion(): string;
		/**
		 * Provides information about WiFi network name where the device is connected.
		 */
		ReadWiFi_NetworkName(): WiFi_NetworkNameRes;
		/**
		 * Providing information about WiFi password where the device is connected.
		 */
		ReadWiFi_Password(): WiFi_PasswordRes;
		/**
		 * Provides information about device's idle timeout. This timeout is seconds in which the connection will be closed when there is an inactivity. This information is available if the device has LAN or WiFi. Maximal value - 7200, minimal value 1. 0 is for never close the connection.
		 */
		Read_IdleTimeout(): number;
		/**
		 * After every change on Idle timeout, LAN/WiFi/GPRS usage, LAN/WiFi/TCP/GPRS password or TCP auto start networks settings this Save command needs to be execute.
		 */
		SaveNetworkSettings(): void;
		/**
		 * Scan and print available wifi networks
		 */
		ScanAndPrintWifiNetworks(): void;
		/**
		 * The device scan out the list of available WiFi networks.
		 */
		ScanWiFiNetworks(): void;
		/**
		 * Register the sell (for correction use minus sign in the price field) of article with specified name, price, quantity, VAT class and/or discount/addition on the transaction.
		 */
		SellPLUfromExtDB(NamePLU: string, OptionVATClass: Tremol.Enums.OptionVATClass, Price: number, MeasureUnit: string, HSCode: string, HSName: string, VATGrRate: number, Quantity?: number, DiscAddP?: number): void;
		/**
		 * Register the sell (for correction use minus sign in the price field) of article with specified name, price, quantity, VAT class and/or discount/addition on the transaction.
		 */
		SellPLUfromExtDB_HS(NamePLU: string, Price: number, HSCode: string, Quantity?: number, DiscAddP?: number): void;
		/**
		 * Sets the date and time and current values.
		 */
		SetDateTime(DateTime: Date): void;
		/**
		 * Program device's NTP address . To apply use - SaveNetworkSettings()
		 */
		SetDeviceNTP_Address(AddressLen: number, NTPAddress: string): void;
		/**
		 * Program device's network IP address, subnet mask, gateway address, DNS address. To apply use -SaveNetworkSettings()
		 */
		SetDeviceTCP_Addresses(OptionAddressType: Tremol.Enums.OptionAddressType, DeviceAddress: string): void;
		/**
		 * Program device's MAC address . To apply use - SaveNetworkSettings()
		 */
		SetDeviceTCP_MACAddress(MACAddress: string): void;
		/**
		 * Program device's TCP network DHCP enabled or disabled. To apply use -SaveNetworkSettings()
		 */
		SetDHCP_Enabled(OptionDHCPEnabled: Tremol.Enums.OptionDHCPEnabled): void;
		/**
		 * Program device's GPRS APN. To apply use -SaveNetworkSettings()
		 */
		SetGPRS_APN(gprsAPNlength: number, APN: string): void;
		/**
		 * Programs GPRS APN authentication type
		 */
		SetGPRS_AuthenticationType(OptionAuthenticationType: Tremol.Enums.OptionAuthenticationType): void;
		/**
		 * Program device's GPRS password. To apply use - SaveNetworkSettings()
		 */
		SetGPRS_Password(PassLength: number, Password: string): void;
		/**
		 * Programs server HTTPS address.
		 */
		SetHTTPS_Address(ParamLength: number, Address: string): void;
		/**
		 * Program device's idle timeout setting. Set timeout for closing the connection if there is an inactivity. Maximal value - 7200, minimal value 1. 0 is for never close the connection. This option can be used only if the device has LAN or WiFi. To apply use - SaveNetworkSettings()
		 */
		SetIdle_Timeout(IdleTimeout: number): void;
		/**
		 * Programs invoice threshold count
		 */
		SetInvoice_ThresholdCount(Value: number): void;
		/**
		 * Stores PIN number in operative memory.
		 */
		SetPINnumber(Password: string, PINnum: string): void;
		/**
		 * Stores the Manufacturing number into the operative memory.
		 */
		SetSerialNum(Password: string, SerialNum: string): void;
		/**
		 * Program device used to talk with the server . To apply use - SaveNetworkSettings()
		 */
		SetServer_UsedComModule(OptionModule: Tremol.Enums.OptionModule): void;
		/**
		 * Selects the active communication module - LAN or WiFi. This option can be set only if the device has both modules at the same time. To apply use - SaveNetworkSettings()
		 */
		SetTCP_ActiveModule(OptionUsedModule: Tremol.Enums.OptionUsedModule): void;
		/**
		 * Program device's autostart TCP conection in sale/line mode. To apply use -SaveNetworkSettings()
		 */
		SetTCP_AutoStart(OptionTCPAutoStart: Tremol.Enums.OptionTCPAutoStart): void;
		/**
		 * Program device's TCP password. To apply use - SaveNetworkSettings()
		 */
		SetTCP_Password(PassLength: number, Password: string): void;
		/**
		 * Programs time threshold minutes
		 */
		SetTime_ThresholdMinutes(Value: number): void;
		/**
		 * Program device's TCP WiFi network name where it will be connected. To apply use -SaveNetworkSettings()
		 */
		SetWiFi_NetworkName(WiFiNameLength: number, WiFiNetworkName: string): void;
		/**
		 * Program device's TCP WiFi password where it will be connected. To apply use -SaveNetworkSettings()
		 */
		SetWiFi_Password(PassLength: number, Password: string): void;
		/**
		 * Restore default parameters of the device.
		 */
		SoftwareReset(Password: string): void;
		/**
		 * Start GPRS test on the device the result
		 */
		StartGPRStest(): void;
		/**
		 * Start LAN test on the device the result
		 */
		StartLANtest(): void;
		/**
		 * Start WiFi test on the device the result
		 */
		StartWiFiTest(): void;
		/**
		 * Store whole Electronic Journal report to External USB Flash memory, External SD card.
		 */
		StoreEJ(OptionReportStorage: Tremol.Enums.OptionReportStorage): void;
		/**
		 * Store Electronic Journal Report from report from date to date to External USB Flash memory, External SD card.
		 */
		StoreEJByDate(OptionReportStorage: Tremol.Enums.OptionReportStorage, StartRepFromDate: Date, EndRepFromDate: Date): void;
		/**
		 * Calculate the subtotal amount with printing and display visualization options. Provide information about values of the calculated amounts. If a percent or value discount/addition has been specified the subtotal and the discount/addition value will be printed regardless the parameter for printing.
		 */
		Subtotal(OptionDisplay: Tremol.Enums.OptionDisplay, DiscAddV?: number, DiscAddP?: number): number;
	}

	declare namespace Enums {
		declare enum OptionTaxable {
			Exempted = '1',
			Taxable = '0',
		}
		declare enum OptionReceiptFormat {
			Brief = '0',
			Detailed = '1',
		}
		declare enum OptionIsReceiptOpened {
			No = '0',
			Yes = '1',
		}
		declare enum OptionClientReceipt {
			invoice_client_receipt = '1',
			standard_receipt = '0',
		}
		declare enum OptionPowerDownInReceipt {
			No = '0',
			Yes = '1',
		}
		declare enum OptionLAN {
			No = '0',
			Yes = '1',
		}
		declare enum OptionWiFi {
			No = '0',
			Yes = '1',
		}
		declare enum OptionGPRS {
			No = '0',
			Yes = '1',
		}
		declare enum OptionBT {
			No = '0',
			Yes = '1',
		}
		declare enum OptionAddressType {
			DNS_address = '5',
			Gateway_address = '4',
			IP_address = '2',
			Subnet_Mask = '3',
		}
		declare enum OptionDHCPEnabled {
			Disabled = '0',
			Enabled = '1',
		}
		declare enum OptionDeviceType {
			A_Type = '1',
			B_Type = '2',
		}
		declare enum OptionReadEJStorage {
			Reading_to_PC = 'J0',
			Reading_to_PC_for_JSON = 'JY',
		}
		declare enum OptionAuthenticationType {
			CHAP = '2',
			None = '0',
			PAP = '1',
			PAP_or_CHAP = '3',
		}
		declare enum OptionServerResponse {
			At_send_EOD = 'Z',
			At_send_receipt = 'R',
		}
		declare enum OptionTransactionType {
			Error_Code = 'c',
			Error_Message = 'm',
			Exception_Message = 'e',
			Status = 's',
		}
		declare enum OptionInvoiceCopy {
			Reading = 'J0',
			Storage_in_External_SD_card_memory = 'J4',
			Storage_in_External_USB_Flash_memory = 'J2',
		}
		declare enum OptionModule {
			GSM = '0',
			LANWiFi = '1',
		}
		declare enum OptionTCPAutoStart {
			No = '0',
			Yes = '1',
		}
		declare enum OptionUsedModule {
			LAN_module = '1',
			WiFi_module = '2',
		}
		declare enum OptionVATClass {
			VAT_Class_A = 'A',
			VAT_Class_B = 'B',
			VAT_Class_C = 'C',
			VAT_Class_D = 'D',
			VAT_Class_E = 'E',
		}
		declare enum OptionReportStorage {
			Storage_in_External_SD_card_memory = 'J4',
			Storage_in_External_SD_card_memory_for_JSON = 'JX',
			Storage_in_External_USB_Flash_memory = 'J2',
			Storage_in_External_USB_Flash_memory_for_JSON = 'Jx',
		}
		declare enum OptionDisplay {
			No = '0',
			Yes = '1',
		}
	}
}