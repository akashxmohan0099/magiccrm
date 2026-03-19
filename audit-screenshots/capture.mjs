import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const DIR = '/Users/akash/Desktop/MAGIC CRM/magic-crm/audit-screenshots';

const PAGES = [
  { name: '01-landing', url: '/' },
  { name: '02-onboarding', url: '/onboarding' },
  { name: '03-dashboard', url: '/dashboard' },
  { name: '04-clients', url: '/dashboard/clients' },
  { name: '05-leads', url: '/dashboard/leads' },
  { name: '06-invoicing', url: '/dashboard/invoicing' },
  { name: '07-jobs', url: '/dashboard/jobs' },
  { name: '08-bookings', url: '/dashboard/bookings' },
  { name: '09-communication', url: '/dashboard/communication' },
  { name: '10-marketing', url: '/dashboard/marketing' },
  { name: '11-support', url: '/dashboard/support' },
  { name: '12-documents', url: '/dashboard/documents' },
  { name: '13-payments', url: '/dashboard/payments' },
  { name: '14-automations', url: '/dashboard/automations' },
  { name: '15-reporting', url: '/dashboard/reporting' },
  { name: '16-settings', url: '/dashboard/settings' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // First, go through onboarding to populate localStorage
  const setupCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const setupPage = await setupCtx.newPage();
  
  // Set up localStorage with sample onboarding data so dashboard has modules
  await setupPage.goto(BASE + '/onboarding');
  await setupPage.waitForTimeout(1500);
  
  // Inject onboarding state directly into localStorage
  await setupPage.evaluate(() => {
    const state = {
      state: {
        step: 0,
        selectedIndustry: "beauty-wellness",
        selectedPersona: "hair-salon",
        businessContext: {
          businessName: "Glow Studio",
          businessDescription: "Premium hair salon in Surry Hills",
          industry: "Beauty & Wellness",
          industryOther: "",
          location: "Sydney, Australia"
        },
        needs: {
          manageCustomers: true,
          receiveInquiries: true,
          communicateClients: true,
          acceptBookings: true,
          sendInvoices: true,
          manageProjects: false,
          runMarketing: true,
          handleSupport: false,
          manageDocuments: false
        },
        teamSize: "2-5",
        featureSelections: {
          "client-database": [
            { id: "client-profiles", label: "Client Profiles", description: "Contact details, notes, and history", selected: true },
            { id: "client-tags", label: "Tags & Categories", description: "Group clients by tags", selected: true },
            { id: "segmentation-filters", label: "Segmentation Filters", description: "Filter by status", selected: false },
            { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "Automatic reminders", selected: true }
          ],
          "leads-pipeline": [
            { id: "lead-inbox", label: "Lead Inbox", description: "Incoming inquiries", selected: true },
            { id: "pipeline-stages", label: "Pipeline Stages", description: "Track progress", selected: true },
            { id: "web-forms", label: "Web Capture Forms", description: "Website forms", selected: true },
            { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "No lead goes cold", selected: true }
          ],
          "communication": [
            { id: "unified-inbox", label: "Unified Inbox", description: "All channels in one view", selected: true },
            { id: "email", label: "Email", description: "Send and receive email", selected: true },
            { id: "sms", label: "SMS", description: "Text messaging", selected: true },
            { id: "instagram-dms", label: "Instagram DMs", description: "Direct messages", selected: true }
          ],
          "bookings-calendar": [
            { id: "booking-page", label: "Online Booking Page", description: "Shareable link", selected: true },
            { id: "availability", label: "Availability Management", description: "Working hours", selected: true },
            { id: "booking-reminders", label: "Automated Reminders", description: "Before appointments", selected: true },
            { id: "recurring-bookings", label: "Recurring Appointments", description: "Repeat bookings", selected: true }
          ],
          "quotes-invoicing": [
            { id: "invoice-builder", label: "Invoice Builder", description: "Professional invoices", selected: true },
            { id: "quote-builder", label: "Quote Builder", description: "Quotes to invoices", selected: true },
            { id: "invoice-templates", label: "Invoice Templates", description: "Reusable templates", selected: true },
            { id: "late-reminders", label: "Late Payment Reminders", description: "Overdue nudges", selected: true }
          ],
          "marketing": [
            { id: "email-campaigns", label: "Email Campaigns", description: "Newsletters", selected: true },
            { id: "campaign-templates", label: "Campaign Templates", description: "Pre-built", selected: true },
            { id: "review-collection", label: "Review Collection", description: "Client reviews", selected: true }
          ],
          "payments": [
            { id: "payment-dashboard", label: "Payment Dashboard", description: "At a glance", selected: true },
            { id: "payment-reminders", label: "Payment Reminders", description: "Overdue reminders", selected: true },
            { id: "revenue-log", label: "Revenue Log", description: "All payments", selected: true }
          ],
          "automations": [
            { id: "auto-status", label: "Auto Status Updates", description: "Move items automatically", selected: true },
            { id: "notifications", label: "Smart Notifications", description: "Important alerts", selected: true }
          ],
          "reporting": [
            { id: "overview-dashboard", label: "Overview Dashboard", description: "Key metrics", selected: true },
            { id: "activity-feed", label: "Activity Feed", description: "Real-time log", selected: true },
            { id: "export-reports", label: "Export Reports", description: "CSV/PDF", selected: true }
          ]
        },
        isBuilding: false,
        buildComplete: true
      },
      version: 3
    };
    localStorage.setItem('magic-crm-onboarding', JSON.stringify(state));
    
    // Add some sample clients
    const clients = {
      state: {
        clients: [
          { id: "c1", name: "Emma Wilson", email: "emma@email.com", phone: "0412 345 678", company: "", address: "42 Crown St, Surry Hills", tags: ["VIP", "regular"], notes: "Prefers balayage, sensitive scalp", source: "referral", status: "active", createdAt: "2026-03-10T10:00:00Z", updatedAt: "2026-03-18T14:00:00Z" },
          { id: "c2", name: "Sophie Chen", email: "sophie.c@gmail.com", phone: "0423 456 789", company: "Chen Media", address: "15 Oxford St, Paddington", tags: ["new"], notes: "First visit - wants full color transformation", source: "social", status: "active", createdAt: "2026-03-15T09:00:00Z", updatedAt: "2026-03-15T09:00:00Z" },
          { id: "c3", name: "James Park", email: "jpark@outlook.com", phone: "0434 567 890", company: "", address: "", tags: ["regular"], notes: "Men's cut every 4 weeks", source: "website", status: "active", createdAt: "2026-02-20T11:00:00Z", updatedAt: "2026-03-17T16:00:00Z" },
          { id: "c4", name: "Lisa Martinez", email: "lisa.m@email.com", phone: "0445 678 901", company: "", address: "88 Bourke Rd, Alexandria", tags: ["VIP"], notes: "Keratin treatment specialist client", source: "referral", status: "active", createdAt: "2026-01-15T08:00:00Z", updatedAt: "2026-03-12T10:00:00Z" },
          { id: "c5", name: "David Thompson", email: "david.t@email.com", phone: "0456 789 012", company: "", address: "", tags: [], notes: "", source: "other", status: "inactive", createdAt: "2025-12-01T10:00:00Z", updatedAt: "2026-01-20T09:00:00Z" }
        ]
      },
      version: 0
    };
    localStorage.setItem('magic-crm-clients', JSON.stringify(clients));
    
    // Add sample activity
    const activity = {
      state: {
        entries: [
          { id: "a1", type: "create", module: "clients", description: 'Added client "Emma Wilson"', timestamp: "2026-03-18T14:00:00Z" },
          { id: "a2", type: "create", module: "clients", description: 'Added client "Sophie Chen"', timestamp: "2026-03-18T13:30:00Z" },
          { id: "a3", type: "create", module: "invoicing", description: 'Created invoice INV-1001', timestamp: "2026-03-18T12:00:00Z" },
          { id: "a4", type: "update", module: "clients", description: 'Updated client "James Park"', timestamp: "2026-03-17T16:00:00Z" },
          { id: "a5", type: "create", module: "bookings", description: 'Booked "Haircut + Color" on 2026-03-20', timestamp: "2026-03-17T11:00:00Z" }
        ]
      },
      version: 0
    };
    localStorage.setItem('magic-crm-activity', JSON.stringify(activity));
  });
  
  await setupPage.waitForTimeout(500);
  await setupCtx.close();

  // Now take screenshots with populated data
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      storageState: undefined,
    });
    const page = await context.newPage();
    
    // Copy localStorage from setup
    await page.goto(BASE + '/onboarding');
    await page.waitForTimeout(500);
    
    // Re-inject localStorage for this context
    await page.evaluate(() => {
      // Same data injection as above (simplified)
      const onboarding = JSON.parse(localStorage.getItem('magic-crm-onboarding') || '{}');
      if (!onboarding.state?.businessContext?.businessName) {
        // Need to re-inject
        const state = {"state":{"step":0,"selectedIndustry":"beauty-wellness","selectedPersona":"hair-salon","businessContext":{"businessName":"Glow Studio","businessDescription":"Premium hair salon in Surry Hills","industry":"Beauty & Wellness","industryOther":"","location":"Sydney, Australia"},"needs":{"manageCustomers":true,"receiveInquiries":true,"communicateClients":true,"acceptBookings":true,"sendInvoices":true,"manageProjects":false,"runMarketing":true,"handleSupport":false,"manageDocuments":false},"teamSize":"2-5","featureSelections":{"client-database":[{"id":"client-profiles","label":"Client Profiles","description":"Contact details, notes, and history","selected":true},{"id":"client-tags","label":"Tags & Categories","description":"Group clients by tags","selected":true},{"id":"follow-up-reminders","label":"Follow-Up Reminders","description":"Automatic reminders","selected":true}],"leads-pipeline":[{"id":"lead-inbox","label":"Lead Inbox","description":"Incoming inquiries","selected":true},{"id":"pipeline-stages","label":"Pipeline Stages","description":"Track progress","selected":true}],"communication":[{"id":"unified-inbox","label":"Unified Inbox","description":"All channels","selected":true},{"id":"email","label":"Email","description":"Email","selected":true},{"id":"sms","label":"SMS","description":"SMS","selected":true}],"bookings-calendar":[{"id":"booking-page","label":"Online Booking Page","description":"Shareable link","selected":true},{"id":"availability","label":"Availability Management","description":"Working hours","selected":true},{"id":"booking-reminders","label":"Automated Reminders","description":"Before appointments","selected":true}],"quotes-invoicing":[{"id":"invoice-builder","label":"Invoice Builder","description":"Professional invoices","selected":true},{"id":"quote-builder","label":"Quote Builder","description":"Quotes to invoices","selected":true}],"marketing":[{"id":"email-campaigns","label":"Email Campaigns","description":"Newsletters","selected":true}],"payments":[{"id":"payment-dashboard","label":"Payment Dashboard","description":"At a glance","selected":true},{"id":"revenue-log","label":"Revenue Log","description":"All payments","selected":true}],"automations":[{"id":"auto-status","label":"Auto Status Updates","description":"Move items automatically","selected":true}],"reporting":[{"id":"overview-dashboard","label":"Overview Dashboard","description":"Key metrics","selected":true},{"id":"activity-feed","label":"Activity Feed","description":"Real-time log","selected":true}]},"isBuilding":false,"buildComplete":true},"version":3};
        localStorage.setItem('magic-crm-onboarding', JSON.stringify(state));
        
        const clients = {"state":{"clients":[{"id":"c1","name":"Emma Wilson","email":"emma@email.com","phone":"0412 345 678","tags":["VIP","regular"],"notes":"Prefers balayage, sensitive scalp","source":"referral","status":"active","createdAt":"2026-03-10T10:00:00Z","updatedAt":"2026-03-18T14:00:00Z"},{"id":"c2","name":"Sophie Chen","email":"sophie.c@gmail.com","phone":"0423 456 789","company":"Chen Media","tags":["new"],"notes":"First visit","source":"social","status":"active","createdAt":"2026-03-15T09:00:00Z","updatedAt":"2026-03-15T09:00:00Z"},{"id":"c3","name":"James Park","email":"jpark@outlook.com","phone":"0434 567 890","tags":["regular"],"notes":"Men's cut every 4 weeks","source":"website","status":"active","createdAt":"2026-02-20T11:00:00Z","updatedAt":"2026-03-17T16:00:00Z"},{"id":"c4","name":"Lisa Martinez","email":"lisa.m@email.com","phone":"0445 678 901","tags":["VIP"],"notes":"Keratin treatment specialist client","source":"referral","status":"active","createdAt":"2026-01-15T08:00:00Z","updatedAt":"2026-03-12T10:00:00Z"},{"id":"c5","name":"David Thompson","email":"david.t@email.com","phone":"0456 789 012","tags":[],"notes":"","source":"other","status":"inactive","createdAt":"2025-12-01T10:00:00Z","updatedAt":"2026-01-20T09:00:00Z"}]},"version":0};
        localStorage.setItem('magic-crm-clients', JSON.stringify(clients));
        
        const activity = {"state":{"entries":[{"id":"a1","type":"create","module":"clients","description":"Added client \"Emma Wilson\"","timestamp":"2026-03-18T14:00:00Z"},{"id":"a2","type":"create","module":"clients","description":"Added client \"Sophie Chen\"","timestamp":"2026-03-18T13:30:00Z"},{"id":"a3","type":"create","module":"invoicing","description":"Created invoice INV-1001","timestamp":"2026-03-18T12:00:00Z"},{"id":"a4","type":"update","module":"clients","description":"Updated client \"James Park\"","timestamp":"2026-03-17T16:00:00Z"},{"id":"a5","type":"create","module":"bookings","description":"Booked \"Haircut + Color\" on 2026-03-20","timestamp":"2026-03-17T11:00:00Z"}]},"version":0};
        localStorage.setItem('magic-crm-activity', JSON.stringify(activity));
      }
    });
    
    await page.waitForTimeout(500);

    for (const p of PAGES) {
      try {
        await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000); // Wait for animations
        
        // Full page screenshot
        await page.screenshot({
          path: `${DIR}/${p.name}-${viewport.name}.png`,
          fullPage: viewport.name === 'desktop', // Full page for desktop, viewport for mobile
        });
        console.log(`✓ ${p.name} (${viewport.name})`);
      } catch (e) {
        console.log(`✗ ${p.name} (${viewport.name}): ${e.message?.slice(0, 80)}`);
      }
    }
    
    await context.close();
  }
  
  await browser.close();
  console.log('\nDone! Screenshots saved to audit-screenshots/');
}

run().catch(console.error);
