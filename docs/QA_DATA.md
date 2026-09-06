# DealFlow360 — Controlled QA Dataset & Test Reference Data

This document provides a complete inventory of the controlled, production-grade test dataset initialized automatically by `DbInitializer.SeedAsync` in the development environment.

---

## 1. Operating Enterprise Entity

| Company Name | Code | Website | Contact Email | Description |
| :--- | :--- | :--- | :--- | :--- |
| **DealFlow360 Technologies Pvt. Ltd.** | `DF360` | `https://www.dealflow360.in` | `sales@dealflow360.in` | Premier enterprise digital sales, IT hardware and cloud infrastructure solutions provider in India. |

---

## 2. Customer Organizations & Discount Ceilings

| # | Organization Name | Tier | Max Tier Discount | Primary Contact Email | Currency |
| :---: | :--- | :---: | :---: | :--- | :---: |
| 1 | **Delhi Business Automation Pvt. Ltd.** | **Bronze** | **5.0%** | `procurement@delhiauto.in` | INR |
| 2 | **Ahmedabad Manufacturing Solutions Pvt. Ltd.** | **Silver** | **10.0%** | `vendor-desk@ahmedabadmfg.com` | INR |
| 3 | **Pune Enterprise Networks Pvt. Ltd.** | **Gold** | **15.0%** | `it-infrastructure@punenet.co.in` | INR |
| 4 | **Bengaluru CloudWorks Pvt. Ltd.** | **Silver** | **10.0%** | `accounts-payable@blrcloudworks.io` | INR |
| 5 | **Sharma Technologies Pvt. Ltd.** | **Gold** | **15.0%** | `rahul.verma@sharmatech.in` | INR |

> **Linked Customer User:**  
> The demo customer login `customer@dealflow360.io` is permanently linked to **Sharma Technologies Pvt. Ltd.** (Gold Tier, 15% discount limit).

---

## 3. Controlled Staff & User Accounts

All development and QA accounts share a standardized password scheme (`<Role>@123`):

| Persona | Name | Email | Password | Role | Team Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | Arjun Mehta | `admin@dealflow360.io` | `Admin@123` | `Admin` | System Wide |
| **System Administrator (Alt)** | Arjun Mehta | `admin@dealflow360.test` | `Admin@123` | `Admin` | System Wide |
| **Sales Manager 1** | Rohan Sharma | `manager@dealflow360.io` | `Manager@123` | `SalesManager` | Enterprise Team |
| **Sales Manager 1 (Alt)** | Rohan Sharma | `manager@dealflow360.test` | `Manager@123` | `SalesManager` | Enterprise Team |
| **Sales Manager 2** | Kavita Rao | `manager2@dealflow360.test` | `Manager@123` | `SalesManager` | Enterprise Team |
| **Sales Representative 1** | Priya Patel | `rep@dealflow360.io` | `Rep@123` | `SalesRep` | Enterprise Team |
| **Sales Representative 1 (Alt)** | Priya Patel | `rep@dealflow360.test` | `Rep@123` | `SalesRep` | Enterprise Team |
| **Sales Representative 2** | Aditya Verma | `rep2@dealflow360.test` | `Rep@123` | `SalesRep` | Enterprise Team |
| **Sales Representative 3** | Neha Joshi | `rep3@dealflow360.test` | `Rep@123` | `SalesRep` | Enterprise Team |
| **Finance Operations** | Sneha Iyer | `finance@dealflow360.io` | `Finance@123` | `FinanceOperations` | Finance Unit |
| **Finance Operations (Alt)** | Sneha Iyer | `finance@dealflow360.test` | `Finance@123` | `FinanceOperations` | Finance Unit |
| **Customer Portal User** | Rahul Verma | `customer@dealflow360.io` | `Customer@123` | `Customer` | Sharma Tech (Gold) |

---

## 4. Controlled Product Catalog (24 Deliverables)

### 4.1 Enterprise Hardware (Category: Hardware)
| SKU | Name | Base Price (INR) | Cost Price (INR) | Unit Margin | Unit |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `P001` | **DealFlow ProBook 14** | ₹75,000.00 | ₹55,000.00 | 26.7% | Unit |
| `P002` | **DealFlow ProBook 16** | ₹95,000.00 | ₹68,000.00 | 28.4% | Unit |
| `P003` | **DealFlow WorkStation X1** | ₹150,000.00 | ₹110,000.00 | 26.7% | Unit |
| `P004` | **DealFlow Server S1** | ₹250,000.00 | ₹185,000.00 | 26.0% | Unit |

### 4.2 Accessories & Peripherals (Category: Accessories)
| SKU | Name | Base Price (INR) | Cost Price (INR) | Unit Margin | Unit |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `P101` | **USB-C Dock Pro** | ₹12,000.00 | ₹7,000.00 | 41.7% | Unit |
| `P102` | **Wireless Business Mouse** | ₹2,500.00 | ₹1,200.00 | 52.0% | Unit |
| `P103` | **Mechanical Business Keyboard** | ₹4,500.00 | ₹2,300.00 | 48.9% | Unit |
| `P104` | **27-inch 4K Monitor** | ₹32,000.00 | ₹21,000.00 | 34.4% | Unit |
| `P105` | **Laptop Carry Bag** | ₹3,000.00 | ₹1,200.00 | 60.0% | Unit |
| `P106` | **UPS Backup 1500VA** | ₹18,000.00 | ₹11,000.00 | 38.9% | Unit |
| `P107` | **Server RAM Upgrade 32GB** | ₹22,000.00 | ₹14,000.00 | 36.4% | Unit |
| `P108` | **Enterprise SSD 2TB** | ₹35,000.00 | ₹23,000.00 | 34.3% | Unit |
| `P109` | **USB-C Basic Cable Adapter** *(Low-Margin Test)* | ₹1,000.00 | ₹900.00 | 10.0% | Unit |

### 4.3 Professional Services (Category: Services)
| SKU | Name | Base Price (INR) | Cost Price (INR) | Unit Margin | Unit |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `P201` | **Installation Service** | ₹5,000.00 | ₹2,000.00 | 60.0% | Service |
| `P202` | **On-Site Setup Service** | ₹8,000.00 | ₹3,500.00 | 56.3% | Service |
| `P203` | **Data Migration Service** | ₹15,000.00 | ₹7,000.00 | 53.3% | Service |
| `P204` | **Annual Maintenance Service** | ₹25,000.00 | ₹12,000.00 | 52.0% | Year |

### 4.4 Technical Support Plans (Category: Support)
| SKU | Name | Base Price (INR) | Cost Price (INR) | Frequency | Unit |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `P301` | **Standard Support** | ₹12,000.00 | ₹5,000.00 | Annual | Year |
| `P302` | **Premium Support** | ₹3,000.00 | ₹1,000.00 | Monthly | Seat/Mo |
| `P303` | **Enterprise Support** | ₹60,000.00 | ₹22,000.00 | Annual | Year |

### 4.5 Cloud Subscriptions (Category: Subscriptions)
| SKU | Name | Base Price (INR) | Cost Price (INR) | Frequency | Unit |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `P401` | **Cloud Basic** | ₹2,000.00 | ₹700.00 | Monthly | Seat/Mo |
| `P402` | **Cloud Business** | ₹5,000.00 | ₹1,500.00 | Monthly | Seat/Mo |
| `P403` | **Cloud Enterprise** | ₹12,000.00 | ₹3,500.00 | Monthly | Seat/Mo |
| `P404` | **Mission Critical Monitoring** | ₹8,000.00 | ₹2,500.00 | Monthly | Device/Mo |

---

## 5. Warehouse Facilities & Initial Stock

| Warehouse Name | Shipping Cost Weight | Primary Role | Initial Allocated Units |
| :--- | :---: | :--- | :---: |
| **Main Warehouse (Mumbai)** | `1.00` | Primary Central Fulfillment | 500+ Units (Comprehensive Catalog) |
| **East Depot (Kolkata)** | `1.20` | Eastern Regional Distribution | 120+ Units (Laptops, Docks, Storage) |
| **West Depot (Ahmedabad)** | `0.80` | Western Fast-Track Hub | 50+ Units (Laptops, Workstations) |

