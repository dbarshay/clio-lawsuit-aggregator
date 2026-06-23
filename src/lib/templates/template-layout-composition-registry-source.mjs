export const templateLayoutCompositionRegistrySource = {
  "templates": [
    {
      "templateId": "template-letterhead-demand-letter",
      "templateName": "Demand Letter With Letterhead",
      "templateKind": "letter",
      "layoutComposition": {
        "mode": "single",
        "assets": [
          {
            "role": "letterhead",
            "assetKey": "barsh-letterhead-standard",
            "required": true,
            "appliesTo": "firstPage",
            "mergeFieldPolicy": "requiresTemplateFields"
          }
        ],
        "outputOrder": [
          "letterhead"
        ]
      }
    },
    {
      "templateId": "template-pleading-summons-complaint",
      "templateName": "Summons and Complaint With Pleading Paper",
      "templateKind": "pleading",
      "layoutComposition": {
        "mode": "single",
        "assets": [
          {
            "role": "pleadingPaper",
            "assetKey": "ny-supreme-pleading-standard",
            "required": true,
            "appliesTo": "bodyOnly",
            "mergeFieldPolicy": "requiresWorkflowFields"
          }
        ],
        "outputOrder": [
          "pleadingPaper"
        ]
      }
    },
    {
      "templateId": "template-fax-cover-and-letter",
      "templateName": "Simple Cover/Fax Page With Letter",
      "templateKind": "fax-letter",
      "layoutComposition": {
        "mode": "composed",
        "assets": [
          {
            "role": "simpleCoverFaxPage",
            "assetKey": "barsh-simple-cover-fax-standard",
            "required": true,
            "appliesTo": "coverOnly",
            "mergeFieldPolicy": "requiresWorkflowFields"
          },
          {
            "role": "letterhead",
            "assetKey": "barsh-letterhead-standard",
            "required": true,
            "appliesTo": "firstPage",
            "mergeFieldPolicy": "requiresTemplateFields"
          }
        ],
        "outputOrder": [
          "simpleCoverFaxPage",
          "letterhead"
        ]
      }
    },
    {
      "templateId": "template-pleading-with-letterhead",
      "templateName": "Pleading Packet With Letterhead",
      "templateKind": "pleading-packet",
      "layoutComposition": {
        "mode": "composed",
        "assets": [
          {
            "role": "letterhead",
            "assetKey": "barsh-letterhead-standard",
            "required": true,
            "appliesTo": "firstPage",
            "mergeFieldPolicy": "requiresTemplateFields"
          },
          {
            "role": "pleadingPaper",
            "assetKey": "ny-supreme-pleading-standard",
            "required": true,
            "appliesTo": "bodyOnly",
            "mergeFieldPolicy": "requiresWorkflowFields"
          }
        ],
        "outputOrder": [
          "letterhead",
          "pleadingPaper"
        ]
      }
    }
  ],
  "registry": {
    "layoutAssets": [
      {
        "role": "letterhead",
        "assetKey": "barsh-letterhead-standard",
        "active": true,
        "label": "Barsh Law standard letterhead",
        "appliesTo": "firstPage",
        "requiredMergeFields": [
          "signer.email",
          "addressee.name",
          "re.line"
        ]
      },
      {
        "role": "pleadingPaper",
        "assetKey": "ny-supreme-pleading-standard",
        "active": true,
        "label": "New York Supreme Court pleading paper",
        "appliesTo": "bodyOnly",
        "requiredMergeFields": [
          "court.name",
          "caption.plaintiff",
          "caption.defendant"
        ]
      },
      {
        "role": "simpleCoverFaxPage",
        "assetKey": "barsh-simple-cover-fax-standard",
        "active": true,
        "label": "Simple cover/fax page",
        "appliesTo": "coverOnly",
        "requiredMergeFields": [
          "fax.to",
          "fax.number"
        ]
      }
    ],
    "allowedCompositions": [
      {
        "roles": [
          "letterhead"
        ]
      },
      {
        "roles": [
          "pleadingPaper"
        ]
      },
      {
        "roles": [
          "simpleCoverFaxPage"
        ]
      },
      {
        "roles": [
          "letterhead",
          "pleadingPaper"
        ]
      },
      {
        "roles": [
          "letterhead",
          "simpleCoverFaxPage"
        ]
      },
      {
        "roles": [
          "pleadingPaper",
          "simpleCoverFaxPage"
        ]
      },
      {
        "roles": [
          "letterhead",
          "pleadingPaper",
          "simpleCoverFaxPage"
        ]
      }
    ],
    "mergeFieldDefinitions": [
      {
        "key": "signer.email"
      },
      {
        "key": "addressee.name"
      },
      {
        "key": "re.line"
      },
      {
        "key": "court.name"
      },
      {
        "key": "caption.plaintiff"
      },
      {
        "key": "caption.defendant"
      },
      {
        "key": "fax.to"
      },
      {
        "key": "fax.number"
      }
    ]
  }
};
