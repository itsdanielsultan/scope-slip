// A fictional, authored service catalogue for this prototype. No sales/users.
export const SAMPLE_REQUEST = 'I need a simple page for my bakery with opening hours, a menu and directions.';

export const SERVICES = Object.freeze([
  {
    id: 'one-page-website',
    title: 'One-page website',
    description: 'Hours, menu, directions and a contact link.',
    semanticText: 'Create a simple one-page website for a local business, bakery, cafe or shop. A single web page displays opening hours, the supplied menu, directions to the business and a contact link. This is a small website or landing page, not an online store.',
    included: 'One page with the supplied menu, hours and directions.',
    confirmFirst: 'Who provides the menu? How often does it change?',
  },
  {
    id: 'menu-cleanup',
    title: 'Menu cleanup',
    description: 'Readable sections and consistent item names.',
    semanticText: 'Clean up an existing food and drink menu for a bakery, cafe or restaurant. Organise menu sections, edit item names and descriptions for consistency, and make a supplied menu easier to read. Work with existing menu text rather than build a website.',
    included: 'Organised sections and consistent names in the supplied menu.',
    confirmFirst: 'Which items are current? Who checks the names and prices?',
  },
  {
    id: 'social-post-set',
    title: 'Social post set',
    description: 'Three reusable graphics for the same offer.',
    semanticText: 'Design three reusable social media graphics promoting one offer for a small local business such as a bakery. Turn supplied product details, business hours and branding into a consistent set of promotional posts. Deliver graphics, not a website or ongoing account management.',
    included: 'Three reusable graphics for one offer using supplied copy and branding.',
    confirmFirst: 'What is the offer? Which sizes, dates and brand files are needed?',
  },
  {
    id: 'spreadsheet-cleanup',
    title: 'Spreadsheet cleanup',
    description: 'Consistent columns, duplicates marked and a clean file.',
    semanticText: 'Clean and organise a spreadsheet or CSV. Standardise column headings and date formats, flag duplicate records and leave a documented clean data file. Useful for messy contact lists, exported inventory tables and repeated spreadsheet rows.',
    included: 'One cleaned spreadsheet with duplicate rows marked and changes listed.',
    confirmFirst: 'Which columns must be kept? Should duplicate rows be removed or only flagged?',
  },
  {
    id: 'podcast-show-notes',
    title: 'Podcast show notes',
    description: 'A short episode summary, sections and supplied links.',
    semanticText: 'Turn a supplied podcast transcript into show notes. Write an episode summary, organise topics and timestamps, and format links supplied by the client. This is writing from a transcript, not recording, audio editing or research of new facts.',
    included: 'Show notes for one episode based on the supplied transcript and links.',
    confirmFirst: 'Is the transcript final? Who verifies names, links and timestamps?',
  },
  {
    id: 'product-photo-cleanup',
    title: 'Product photo cleanup',
    description: 'A consistent crop and background for supplied photos.',
    semanticText: 'Edit supplied product photographs for an online listing. Make background, crop and framing consistent across a small set of photos without changing the product. Deliver image files; no photography session, listing text or social media campaign.',
    included: 'A consistent crop and background for the agreed set of supplied product photos.',
    confirmFirst: 'How many photos? What background, dimensions and file format are required?',
  },
  {
    id: 'video-caption-cleanup',
    title: 'Video caption cleanup',
    description: 'Readable captions checked against a supplied transcript.',
    semanticText: 'Clean up subtitle captions for a short video using its supplied transcript. Correct line breaks, spelling and timing in an existing SRT caption file. Deliver a caption file, not video editing, recording or a social media campaign.',
    included: 'One checked caption file with clearer line breaks and consistent spelling.',
    confirmFirst: 'Which video version and transcript are final? What language and caption format are needed?',
  },
]);

export const SERVICE_BY_ID = new Map(SERVICES.map((service) => [service.id, service]));
