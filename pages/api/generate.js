Get started with Email Routing
This process will guide you through creating a custom address and configuring your DNS to enable Email Routing for this domain.

Configure your DNS
A combination of MX and TXT records need to be added to your DNS for Email Routing to function properly. MX records allow your domain to receive email. The TXT record is configured to allow your domain to send incoming emails out to your preferred email provider.

Conflicting records

The records listed below were found on the DNS for mystorija.com. These records need to be deleted for Email Routing to work properly.
Record type	Hostname	Priority	Value	
MX	mystorija.com	10	eforward1.registrar-servers.com.	Delete
MX	mystorija.com	10	eforward2.registrar-servers.com.	Delete
MX	mystorija.com	10	eforward3.registrar-servers.com.	Delete
MX	mystorija.com	15	eforward4.registrar-servers.com.	Delete
MX	mystorija.com	20	eforward5.registrar-servers.com.	Delete
TXT	mystorija.com		"v=spf1 include:spf.efwd.registrar-servers.com ~all"	Delete

Required records

The records listed below are required on mystorija.com to enable Email Routing. MX records allow your domain to receive email. The TXT record is configured to allow your domain to send incoming emails out to your preferred email provider.
Record type	Hostname	Priority	Value	Status
MX	mystorija.com	84	route1.mx.cloudflare.net.	
MX	mystorija.com	77	route2.mx.cloudflare.net.	
MX	mystorija.com	98	route3.mx.cloudflare.net.	
TXT	cf2024-1._domainkey.mystorija.com		"v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiweykoi+o48IOGuP7GR3X0MOExCUDY/BCRHoWBnh3rChl7WhdyCxW3jgq1daEjPPqoi7sJvdg5hEQVsgVRQP4DcnQDVjGMbASQtrY4WmB1VebF+RPJB2ECPsEDTpeiI5ZyUAwJaVX7r6bznU67g7LvFq35yIo4sdlmtZGV+i0H4cpYH9+3JJ78km4KXwaf9xUJCWF6nxeD+qG6Fyruw1Qlbds2r85U9dkNDVAS3gioCvELryh1TxKGiVTkg4wqHTyHfWsp7KD3WQHYJn0RyfJJu6YEmL77zonn7p2SRMvTMP3ZEXibnC9gz3nnhR6wcYL8Q7zXypKTMD58bTixDSJwIDAQAB"	
TXT	mystorija.com		"v=spf1 include:_spf.mx.cloudflare.net ~all"	
You can automatically add these records to your DNS, or manually create new records on the DNS page.

