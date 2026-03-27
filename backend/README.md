Django Admin
Username: lguluna
Password: DTMIS2026


All Users password: pogiako123

/**------------AUTH------------**/
** URL: http://127.0.0.1:8000/auth/login/ **
Method: POST
Description: API para sa Login
Sample Request:
{
  "email": "fullname@gmail.com",
  "password": "pogiako123"
}

Sample Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NzQzNDgxMTIsImlhdCI6MTc3NDI2MTcxMn0.xpK_clEirjqsNBBX5BSjYcRHB3emebZrXVJc-hVkD_k",
  "user": {
    "id": 1,
    "full_name": "Full Name",
    "email": "fullname@gmail.com",
    "department": "accounting",
    "status": "active"
  }
}

** URL: http://127.0.0.1:8000/auth/me/ **
Method: GET
Description: API para i-fetch yung personal data mo
Sample Request: I-paste niyo yung access token sa bearer. Makukuha yung access token after mag-login sa response ng url.
Sample Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NzQzNDgxMTIsImlhdCI6MTc3NDI2MTcxMn0.xpK_clEirjqsNBBX5BSjYcRHB3emebZrXVJc-hVkD_k",
  "user": {
    "id": 1,
    "full_name": "Full Name",
    "email": "fullname@gmail.com",
    "department": "accounting",
    "status": "active"
  }
}

/**------------ADMIN------------**/
** URL: http://127.0.0.1:8000/api/auth/signup/ **
Method: POST
Description: API para mag-create/register ng another user, Di niyo need ng bearer/token.
Sample Request: {
  "id": 8,
  "full_name": "Ham Man",
  "email": "hm@gmail.com",
  "department": "bac_gso",
  "status": "active"
}

** URL: http://127.0.0.1:8000/api/users/ **
Method: GET
Description: API para i-fetch yung mga users except admin, Di niyo need ng bearer/token.
Sample Request: [
  {
    "id": 2,
    "full_name": "Bini Maloi",
    "email": "bm@gmail.com",
    "department": "budget",
    "status": "inactive"
  },
  {
    "id": 6,
    "full_name": "Donald Duck",
    "email": "dd@gmail.com",
    "department": "admin",
    "status": "active"
  },
  {
    "id": 8,
    "full_name": "Ham Man",
    "email": "hm@gmail.com",
    "department": "bac_gso",
    "status": "active"
  },
  {
    "id": 1,
    "full_name": "Jem Vladimir Negranza",
    "email": "bagoman.321@gmail.com",
    "department": "accounting",
    "status": "active"
  },
  {
    "id": 7,
    "full_name": "Louis Ricardo Servito",
    "email": "lrs@gmail.com",
    "department": "budget",
    "status": "active"
  },
  {
    "id": 5,
    "full_name": "Rastaman",
    "email": "r@gmail.com",
    "department": "mayors_office",
    "status": "active"
  },
  {
    "id": 3,
    "full_name": "Sarah Discaya",
    "email": "sd@gmail.com",
    "department": "treasurer",
    "status": "active"
  },
  {
    "id": 4,
    "full_name": "Victor Wembanyawa",
    "email": "vw@gmail.com",
    "department": "bac_gso",
    "status": "inactive"
  }
]

/**------------DV------------**/
** URL: http://127.0.0.1:8000/api/dv/ **
Method: GET
Description: API para sa i-fetch lahat ng disbursement Vouchers
Sample Request: I-paste niyo yung access token sa bearer. Makukuha yung access token after mag-login sa response ng url.
Sample Response:
[
  {
    "id": 4,
    "accounting_name": "Jem Vladimir Negranza",
    "current_step_label": "Accounting",
    "payments": [
      {
        "id": 17,
        "mop": "CASH",
        "mop_specify": "",
        "atm_no": "",
        "bank": "",
        "date": null
      }
    ],
    "particulars": [
      {
        "id": 17,
        "description": "13213d2d1",
        "jev_no": "",
        "date": null,
        "organic_np": "12332.00",
        "devolved_np": "123131.00",
        "vmsb_np": "12331.00",
        "adjustment_np": "0.00",
        "organic_ft": "123131.00",
        "devolved_ft": "1321.00",
        "vmsb_ft": "231321.00",
        "adjustment_ft": "0.00",
        "organic_tf": "132131.00",
        "devolved_tf": "132131.00",
        "vmsb_tf": "12331.00",
        "adjustment_tf": "0.00"
      }
    ],
    "journal_entries": [
      {
        "id": 17,
        "account_code": "131",
        "particulars": "wdwdwdwdwd",
        "debit": "3132.00",
        "credit": "0.00"
      },
      {
        "id": 18,
        "account_code": "123",
        "particulars": "kufall",
        "debit": null,
        "credit": "3132.00"
      }
    ],
    "workflow_steps": [
      {
        "id": 16,
        "dv": 4,
        "step": 1,
        "step_label": "Accounting",
        "status": "submitted",
        "remarks": "DV created as draft.",
        "action_date": "2026-03-22T11:20:12.718336Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      }
    ],
    "archive_info": null,
    "dv_no": "2313",
    "tracking_no": "2313131",
    "payee": "3131",
    "office": "213113",
    "cafoa_no": "",
    "created_date": "2026-03-22",
    "advice_no": "",
    "responsibility_center": "",
    "fund_source": "GF",
    "tin": "",
    "status": "draft",
    "current_step": 1,
    "last_disapproved_step": null,
    "created_at": "2026-03-22T11:20:12.686014Z",
    "updated_at": "2026-03-23T08:55:03.529858Z",
    "accounting": 1
  },
  {
    "id": 3,
    "accounting_name": "Jem Vladimir Negranza",
    "current_step_label": "Accounting",
    "payments": [
      {
        "id": 12,
        "mop": "CASH",
        "mop_specify": "",
        "atm_no": "",
        "bank": "",
        "date": null
      }
    ],
    "particulars": [
      {
        "id": 12,
        "description": "ACADA",
        "jev_no": "",
        "date": null,
        "organic_np": "300.10",
        "devolved_np": "0.00",
        "vmsb_np": "0.00",
        "adjustment_np": "0.00",
        "organic_ft": "0.00",
        "devolved_ft": "0.00",
        "vmsb_ft": "0.00",
        "adjustment_ft": "0.00",
        "organic_tf": "0.00",
        "devolved_tf": "0.00",
        "vmsb_tf": "0.00",
        "adjustment_tf": "0.00"
      }
    ],
    "journal_entries": [],
    "workflow_steps": [
      {
        "id": 15,
        "dv": 3,
        "step": 1,
        "step_label": "Accounting",
        "status": "submitted",
        "remarks": "DV created as draft.",
        "action_date": "2026-03-22T10:20:21.235976Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      }
    ],
    "archive_info": null,
    "dv_no": "5345353",
    "tracking_no": "43535353",
    "payee": "BANNOG NA",
    "office": "PRESIDENT",
    "cafoa_no": "",
    "created_date": "2026-03-22",
    "advice_no": "",
    "responsibility_center": "",
    "fund_source": "GF",
    "tin": "",
    "status": "draft",
    "current_step": 1,
    "last_disapproved_step": null,
    "created_at": "2026-03-22T10:20:21.148975Z",
    "updated_at": "2026-03-22T10:35:37.419436Z",
    "accounting": 1
  },
  {
    "id": 2,
    "accounting_name": "Jem Vladimir Negranza",
    "current_step_label": "BAC/GSO",
    "payments": [
      {
        "id": 7,
        "mop": "CHECK",
        "mop_specify": "",
        "atm_no": "31233123131131",
        "bank": "BANKO NG CHINA",
        "date": "2026-03-22"
      }
    ],
    "particulars": [
      {
        "id": 7,
        "description": "FSWFMOPWMF1CS",
        "jev_no": "1312413463",
        "date": "2026-03-22",
        "organic_np": "123131.00",
        "devolved_np": "213131.00",
        "vmsb_np": "7858585.00",
        "adjustment_np": "0.02",
        "organic_ft": "132325.00",
        "devolved_ft": "0.00",
        "vmsb_ft": "352525265.00",
        "adjustment_ft": null,
        "organic_tf": "75636.00",
        "devolved_tf": "363545.00",
        "vmsb_tf": "757568585.00",
        "adjustment_tf": "0.00"
      }
    ],
    "journal_entries": [],
    "workflow_steps": [
      {
        "id": 7,
        "dv": 2,
        "step": 1,
        "step_label": "Accounting",
        "status": "submitted",
        "remarks": "DV created as draft.",
        "action_date": "2026-03-22T06:33:15.998904Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      },
      {
        "id": 8,
        "dv": 2,
        "step": 1,
        "step_label": "Accounting",
        "status": "submitted",
        "remarks": "Disbursement voucher is submitted for processing.",
        "action_date": "2026-03-22T06:33:43.723962Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      },
      {
        "id": 9,
        "dv": 2,
        "step": 2,
        "step_label": "Budget",
        "status": "disapproved",
        "remarks": "Kufal NAMAN",
        "action_date": "2026-03-22T06:42:00.406915Z",
        "action_by": 7,
        "action_by_name": "Louis Ricardo Servito",
        "action_by_department": "Budget"
      },
      {
        "id": 10,
        "dv": 2,
        "step": 1,
        "step_label": "Accounting",
        "status": "resubmitted",
        "remarks": "Sorry po kung kupal si payee",
        "action_date": "2026-03-22T06:43:29.400639Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      },
      {
        "id": 11,
        "dv": 2,
        "step": 2,
        "step_label": "Budget",
        "status": "approved",
        "remarks": "ayos",
        "action_date": "2026-03-22T06:43:54.559785Z",
        "action_by": 7,
        "action_by_name": "Louis Ricardo Servito",
        "action_by_department": "Budget"
      },
      {
        "id": 12,
        "dv": 2,
        "step": 3,
        "step_label": "Treasurer",
        "status": "disapproved",
        "remarks": "PALITAN NG BANKO NG CHINA",
        "action_date": "2026-03-22T07:05:19.590083Z",
        "action_by": 3,
        "action_by_name": "Sarah Discaya",
        "action_by_department": "Treasurer"
      },
      {
        "id": 13,
        "dv": 2,
        "step": 1,
        "step_label": "Accounting",
        "status": "resubmitted",
        "remarks": "BANKO NG CHING-CHONG",
        "action_date": "2026-03-22T07:06:04.240440Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      },
      {
        "id": 14,
        "dv": 2,
        "step": 3,
        "step_label": "Treasurer",
        "status": "approved",
        "remarks": "",
        "action_date": "2026-03-22T07:06:32.158328Z",
        "action_by": 3,
        "action_by_name": "Sarah Discaya",
        "action_by_department": "Treasurer"
      }
    ],
    "archive_info": null,
    "dv_no": "2340234242",
    "tracking_no": "1312321131",
    "payee": "HINDI SI KUPAL",
    "office": "3132313",
    "cafoa_no": "",
    "created_date": "2026-03-22",
    "advice_no": "",
    "responsibility_center": "MULTIPLE",
    "fund_source": "PHILHEALTH",
    "tin": "",
    "status": "pending",
    "current_step": 4,
    "last_disapproved_step": 3,
    "created_at": "2026-03-22T06:33:15.953006Z",
    "updated_at": "2026-03-22T07:06:32.207449Z",
    "accounting": 1
  },
  {
    "id": 1,
    "accounting_name": "Jem Vladimir Negranza",
    "current_step_label": "Completed",
    "payments": [
      {
        "id": 4,
        "mop": "CASH",
        "mop_specify": "",
        "atm_no": "",
        "bank": "",
        "date": "2026-03-24"
      }
    ],
    "particulars": [
      {
        "id": 4,
        "description": "e1211e1e1",
        "jev_no": "1231313131",
        "date": "2026-03-18",
        "organic_np": "1231213.00",
        "devolved_np": "2132131.00",
        "vmsb_np": "13131133113.00",
        "adjustment_np": "0.00",
        "organic_ft": "1233131.00",
        "devolved_ft": "3213131.00",
        "vmsb_ft": "31321212.00",
        "adjustment_ft": "0.00",
        "organic_tf": "12311313.00",
        "devolved_tf": "1321312312.00",
        "vmsb_tf": "13132312.00",
        "adjustment_tf": "0.00"
      }
    ],
    "journal_entries": [],
    "workflow_steps": [
      {
        "id": 1,
        "dv": 1,
        "step": 1,
        "step_label": "Accounting",
        "status": "submitted",
        "remarks": "DV created as draft.",
        "action_date": "2026-03-21T13:23:43.342396Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      },
      {
        "id": 2,
        "dv": 1,
        "step": 1,
        "step_label": "Accounting",
        "status": "submitted",
        "remarks": "DV submitted for processing.",
        "action_date": "2026-03-21T13:25:17.044982Z",
        "action_by": 1,
        "action_by_name": "Jem Vladimir Negranza",
        "action_by_department": "Accounting"
      },
      {
        "id": 3,
        "dv": 1,
        "step": 2,
        "step_label": "Budget",
        "status": "approved",
        "remarks": "",
        "action_date": "2026-03-21T13:27:51.849878Z",
        "action_by": 2,
        "action_by_name": "Bini Maloi",
        "action_by_department": "Budget"
      },
      {
        "id": 4,
        "dv": 1,
        "step": 3,
        "step_label": "Treasurer",
        "status": "approved",
        "remarks": "Cough-fal",
        "action_date": "2026-03-21T13:30:00.151580Z",
        "action_by": 3,
        "action_by_name": "Sarah Discaya",
        "action_by_department": "Treasurer"
      },
      {
        "id": 5,
        "dv": 1,
        "step": 4,
        "step_label": "BAC/GSO",
        "status": "approved",
        "remarks": "Ayos na",
        "action_date": "2026-03-21T13:33:21.213029Z",
        "action_by": 4,
        "action_by_name": "Victor Wembanyawa",
        "action_by_department": "BAC/GSO"
      },
      {
        "id": 6,
        "dv": 1,
        "step": 5,
        "step_label": "Mayor's Office",
        "status": "approved",
        "remarks": "",
        "action_date": "2026-03-21T13:34:47.008814Z",
        "action_by": 5,
        "action_by_name": "Rastaman",
        "action_by_department": "Mayor's Office"
      }
    ],
    "archive_info": null,
    "dv_no": "131323135",
    "tracking_no": "3131123",
    "payee": "Pastor",
    "office": "VP",
    "cafoa_no": "",
    "created_date": "2026-03-21",
    "advice_no": "",
    "responsibility_center": "Multiple",
    "fund_source": "PHILHEALTH",
    "tin": "",
    "status": "completed",
    "current_step": 6,
    "last_disapproved_step": null,
    "created_at": "2026-03-21T13:23:43.254505Z",
    "updated_at": "2026-03-21T13:34:47.056662Z",
    "accounting": 1
  }
]

/**------------Dashboard------------**/
** URL: http://127.0.0.1:8000/api/dashboard/ **
Method: GET
Description: API para i-fetch yung mga data na i-display sa dashboard, Need ng bearer/token.
Sample Request: I-paste niyo yung access token sa bearer. Makukuha yung access token after mag-login sa response ng url.
Sample Response:
{
  "total": 4,
  "draft": 2,
  "pending": 1,
  "disapproved": 0,
  "completed": 1,
  "archived": 0,
  "for_action": 2,
  "recent_dvs": [
    {
      "id": 4,
      "accounting_name": "Jem Vladimir Negranza",
      "current_step_label": "Accounting",
      "payments": [
        {
          "id": 17,
          "mop": "CASH",
          "mop_specify": "",
          "atm_no": "",
          "bank": "",
          "date": null
        }
      ],
      "particulars": [
        {
          "id": 17,
          "description": "13213d2d1",
          "jev_no": "",
          "date": null,
          "organic_np": "12332.00",
          "devolved_np": "123131.00",
          "vmsb_np": "12331.00",
          "adjustment_np": "0.00",
          "organic_ft": "123131.00",
          "devolved_ft": "1321.00",
          "vmsb_ft": "231321.00",
          "adjustment_ft": "0.00",
          "organic_tf": "132131.00",
          "devolved_tf": "132131.00",
          "vmsb_tf": "12331.00",
          "adjustment_tf": "0.00"
        }
      ],
      "journal_entries": [
        {
          "id": 17,
          "account_code": "131",
          "particulars": "wdwdwdwdwd",
          "debit": "3132.00",
          "credit": "0.00"
        },
        {
          "id": 18,
          "account_code": "123",
          "particulars": "kufall",
          "debit": null,
          "credit": "3132.00"
        }
      ],
      "workflow_steps": [
        {
          "id": 16,
          "dv": 4,
          "step": 1,
          "step_label": "Accounting",
          "status": "submitted",
          "remarks": "DV created as draft.",
          "action_date": "2026-03-22T11:20:12.718336Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        }
      ],
      "archive_info": null,
      "dv_no": "2313",
      "tracking_no": "2313131",
      "payee": "3131",
      "office": "213113",
      "cafoa_no": "",
      "created_date": "2026-03-22",
      "advice_no": "",
      "responsibility_center": "",
      "fund_source": "GF",
      "tin": "",
      "status": "draft",
      "current_step": 1,
      "last_disapproved_step": null,
      "created_at": "2026-03-22T11:20:12.686014Z",
      "updated_at": "2026-03-23T08:55:03.529858Z",
      "accounting": 1
    },
    {
      "id": 3,
      "accounting_name": "Jem Vladimir Negranza",
      "current_step_label": "Accounting",
      "payments": [
        {
          "id": 12,
          "mop": "CASH",
          "mop_specify": "",
          "atm_no": "",
          "bank": "",
          "date": null
        }
      ],
      "particulars": [
        {
          "id": 12,
          "description": "ACADA",
          "jev_no": "",
          "date": null,
          "organic_np": "300.10",
          "devolved_np": "0.00",
          "vmsb_np": "0.00",
          "adjustment_np": "0.00",
          "organic_ft": "0.00",
          "devolved_ft": "0.00",
          "vmsb_ft": "0.00",
          "adjustment_ft": "0.00",
          "organic_tf": "0.00",
          "devolved_tf": "0.00",
          "vmsb_tf": "0.00",
          "adjustment_tf": "0.00"
        }
      ],
      "journal_entries": [],
      "workflow_steps": [
        {
          "id": 15,
          "dv": 3,
          "step": 1,
          "step_label": "Accounting",
          "status": "submitted",
          "remarks": "DV created as draft.",
          "action_date": "2026-03-22T10:20:21.235976Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        }
      ],
      "archive_info": null,
      "dv_no": "5345353",
      "tracking_no": "43535353",
      "payee": "BANNOG NA",
      "office": "PRESIDENT",
      "cafoa_no": "",
      "created_date": "2026-03-22",
      "advice_no": "",
      "responsibility_center": "",
      "fund_source": "GF",
      "tin": "",
      "status": "draft",
      "current_step": 1,
      "last_disapproved_step": null,
      "created_at": "2026-03-22T10:20:21.148975Z",
      "updated_at": "2026-03-22T10:35:37.419436Z",
      "accounting": 1
    },
    {
      "id": 2,
      "accounting_name": "Jem Vladimir Negranza",
      "current_step_label": "BAC/GSO",
      "payments": [
        {
          "id": 7,
          "mop": "CHECK",
          "mop_specify": "",
          "atm_no": "31233123131131",
          "bank": "BANKO NG CHINA",
          "date": "2026-03-22"
        }
      ],
      "particulars": [
        {
          "id": 7,
          "description": "FSWFMOPWMF1CS",
          "jev_no": "1312413463",
          "date": "2026-03-22",
          "organic_np": "123131.00",
          "devolved_np": "213131.00",
          "vmsb_np": "7858585.00",
          "adjustment_np": "0.02",
          "organic_ft": "132325.00",
          "devolved_ft": "0.00",
          "vmsb_ft": "352525265.00",
          "adjustment_ft": null,
          "organic_tf": "75636.00",
          "devolved_tf": "363545.00",
          "vmsb_tf": "757568585.00",
          "adjustment_tf": "0.00"
        }
      ],
      "journal_entries": [],
      "workflow_steps": [
        {
          "id": 7,
          "dv": 2,
          "step": 1,
          "step_label": "Accounting",
          "status": "submitted",
          "remarks": "DV created as draft.",
          "action_date": "2026-03-22T06:33:15.998904Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        },
        {
          "id": 8,
          "dv": 2,
          "step": 1,
          "step_label": "Accounting",
          "status": "submitted",
          "remarks": "Disbursement voucher is submitted for processing.",
          "action_date": "2026-03-22T06:33:43.723962Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        },
        {
          "id": 9,
          "dv": 2,
          "step": 2,
          "step_label": "Budget",
          "status": "disapproved",
          "remarks": "Kufal NAMAN",
          "action_date": "2026-03-22T06:42:00.406915Z",
          "action_by": 7,
          "action_by_name": "Louis Ricardo Servito",
          "action_by_department": "Budget"
        },
        {
          "id": 10,
          "dv": 2,
          "step": 1,
          "step_label": "Accounting",
          "status": "resubmitted",
          "remarks": "Sorry po kung kupal si payee",
          "action_date": "2026-03-22T06:43:29.400639Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        },
        {
          "id": 11,
          "dv": 2,
          "step": 2,
          "step_label": "Budget",
          "status": "approved",
          "remarks": "ayos",
          "action_date": "2026-03-22T06:43:54.559785Z",
          "action_by": 7,
          "action_by_name": "Louis Ricardo Servito",
          "action_by_department": "Budget"
        },
        {
          "id": 12,
          "dv": 2,
          "step": 3,
          "step_label": "Treasurer",
          "status": "disapproved",
          "remarks": "PALITAN NG BANKO NG CHINA",
          "action_date": "2026-03-22T07:05:19.590083Z",
          "action_by": 3,
          "action_by_name": "Sarah Discaya",
          "action_by_department": "Treasurer"
        },
        {
          "id": 13,
          "dv": 2,
          "step": 1,
          "step_label": "Accounting",
          "status": "resubmitted",
          "remarks": "BANKO NG CHING-CHONG",
          "action_date": "2026-03-22T07:06:04.240440Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        },
        {
          "id": 14,
          "dv": 2,
          "step": 3,
          "step_label": "Treasurer",
          "status": "approved",
          "remarks": "",
          "action_date": "2026-03-22T07:06:32.158328Z",
          "action_by": 3,
          "action_by_name": "Sarah Discaya",
          "action_by_department": "Treasurer"
        }
      ],
      "archive_info": null,
      "dv_no": "2340234242",
      "tracking_no": "1312321131",
      "payee": "HINDI SI KUPAL",
      "office": "3132313",
      "cafoa_no": "",
      "created_date": "2026-03-22",
      "advice_no": "",
      "responsibility_center": "MULTIPLE",
      "fund_source": "PHILHEALTH",
      "tin": "",
      "status": "pending",
      "current_step": 4,
      "last_disapproved_step": 3,
      "created_at": "2026-03-22T06:33:15.953006Z",
      "updated_at": "2026-03-22T07:06:32.207449Z",
      "accounting": 1
    },
    {
      "id": 1,
      "accounting_name": "Jem Vladimir Negranza",
      "current_step_label": "Completed",
      "payments": [
        {
          "id": 4,
          "mop": "CASH",
          "mop_specify": "",
          "atm_no": "",
          "bank": "",
          "date": "2026-03-24"
        }
      ],
      "particulars": [
        {
          "id": 4,
          "description": "e1211e1e1",
          "jev_no": "1231313131",
          "date": "2026-03-18",
          "organic_np": "1231213.00",
          "devolved_np": "2132131.00",
          "vmsb_np": "13131133113.00",
          "adjustment_np": "0.00",
          "organic_ft": "1233131.00",
          "devolved_ft": "3213131.00",
          "vmsb_ft": "31321212.00",
          "adjustment_ft": "0.00",
          "organic_tf": "12311313.00",
          "devolved_tf": "1321312312.00",
          "vmsb_tf": "13132312.00",
          "adjustment_tf": "0.00"
        }
      ],
      "journal_entries": [],
      "workflow_steps": [
        {
          "id": 1,
          "dv": 1,
          "step": 1,
          "step_label": "Accounting",
          "status": "submitted",
          "remarks": "DV created as draft.",
          "action_date": "2026-03-21T13:23:43.342396Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        },
        {
          "id": 2,
          "dv": 1,
          "step": 1,
          "step_label": "Accounting",
          "status": "submitted",
          "remarks": "DV submitted for processing.",
          "action_date": "2026-03-21T13:25:17.044982Z",
          "action_by": 1,
          "action_by_name": "Jem Vladimir Negranza",
          "action_by_department": "Accounting"
        },
        {
          "id": 3,
          "dv": 1,
          "step": 2,
          "step_label": "Budget",
          "status": "approved",
          "remarks": "",
          "action_date": "2026-03-21T13:27:51.849878Z",
          "action_by": 2,
          "action_by_name": "Bini Maloi",
          "action_by_department": "Budget"
        },
        {
          "id": 4,
          "dv": 1,
          "step": 3,
          "step_label": "Treasurer",
          "status": "approved",
          "remarks": "Cough-fal",
          "action_date": "2026-03-21T13:30:00.151580Z",
          "action_by": 3,
          "action_by_name": "Sarah Discaya",
          "action_by_department": "Treasurer"
        },
        {
          "id": 5,
          "dv": 1,
          "step": 4,
          "step_label": "BAC/GSO",
          "status": "approved",
          "remarks": "Ayos na",
          "action_date": "2026-03-21T13:33:21.213029Z",
          "action_by": 4,
          "action_by_name": "Victor Wembanyawa",
          "action_by_department": "BAC/GSO"
        },
        {
          "id": 6,
          "dv": 1,
          "step": 5,
          "step_label": "Mayor's Office",
          "status": "approved",
          "remarks": "",
          "action_date": "2026-03-21T13:34:47.008814Z",
          "action_by": 5,
          "action_by_name": "Rastaman",
          "action_by_department": "Mayor's Office"
        }
      ],
      "archive_info": null,
      "dv_no": "131323135",
      "tracking_no": "3131123",
      "payee": "Pastor",
      "office": "VP",
      "cafoa_no": "",
      "created_date": "2026-03-21",
      "advice_no": "",
      "responsibility_center": "Multiple",
      "fund_source": "PHILHEALTH",
      "tin": "",
      "status": "completed",
      "current_step": 6,
      "last_disapproved_step": null,
      "created_at": "2026-03-21T13:23:43.254505Z",
      "updated_at": "2026-03-21T13:34:47.056662Z",
      "accounting": 1
    }
  ]
}