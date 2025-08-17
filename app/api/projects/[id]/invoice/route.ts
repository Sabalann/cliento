import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import puppeteer from 'puppeteer';

const uri = process.env.MONGODB_URI || "mongodb+srv://sab:sabdatabase@practice.kt5d0mh.mongodb.net/?retryWrites=true&w=majority&appName=practice";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Helper function to generate invoice HTML
function generateInvoiceHTML(project: any, developer: any, client: any, invoiceNumber: string, amount: number) {
  const currentDate = new Date().toLocaleDateString('nl-NL');
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL'); // 30 dagen vanaf nu

  return `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factuur ${invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #007bff;
        }
        .invoice-info {
          text-align: right;
        }
        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .party {
          width: 45%;
        }
        .party-title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 10px;
          color: #007bff;
        }
        .party-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        .project-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 30px;
        }
        .project-title {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 15px;
          color: #007bff;
        }
        .amount-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .amount-table th,
        .amount-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .amount-table th {
          background-color: #007bff;
          color: white;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 14px;
          color: #666;
        }
        .payment-info {
          background: #e7f3ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="invoice-title">FACTUUR</div>
          <div style="font-size: 14px; color: #666;">Cliento Project Management</div>
        </div>
        <div class="invoice-info">
          <div><strong>Factuurnummer:</strong> ${invoiceNumber}</div>
          <div><strong>Factuurdatum:</strong> ${currentDate}</div>
          <div><strong>Vervaldatum:</strong> ${dueDate}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-title">Van (Developer):</div>
          <div class="party-info">
            <div><strong>${developer.companyName || developer.username}</strong></div>
            <div>${developer.email}</div>
            ${developer.phoneNumber ? `<div>${developer.phoneNumber}</div>` : ''}
            ${developer.postalCode && developer.city ? `<div>${developer.postalCode} ${developer.city}</div>` : ''}
            ${developer.country ? `<div>${developer.country}</div>` : ''}
            ${developer.KVKNumber ? `<div>KVK: ${developer.KVKNumber}</div>` : ''}
            ${developer.BTWNumber ? `<div>BTW: ${developer.BTWNumber}</div>` : ''}
          </div>
        </div>
        
        <div class="party">
          <div class="party-title">Aan (Klant):</div>
          <div class="party-info">
            <div><strong>${client.companyName || client.username}</strong></div>
            <div>${client.email}</div>
            ${client.phoneNumber ? `<div>${client.phoneNumber}</div>` : ''}
            ${client.postalCode && client.city ? `<div>${client.postalCode} ${client.city}</div>` : ''}
            ${client.country ? `<div>${client.country}</div>` : ''}
            ${client.KVKNumber ? `<div>KVK: ${client.KVKNumber}</div>` : ''}
            ${client.BTWNumber ? `<div>BTW: ${client.BTWNumber}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="project-details">
        <div class="project-title">Project Details</div>
        <div><strong>Projectnaam:</strong> ${project.name}</div>
        <div><strong>Status:</strong> ${project.status}</div>
        ${project.deadline ? `<div><strong>Deadline:</strong> ${new Date(project.deadline).toLocaleDateString('nl-NL')}</div>` : ''}
        <div><strong>Aanmaakdatum:</strong> ${new Date(project.createdAt).toLocaleDateString('nl-NL')}</div>
        ${project.lastUpdated ? `<div><strong>Laatst bijgewerkt:</strong> ${new Date(project.lastUpdated).toLocaleDateString('nl-NL')}</div>` : ''}
      </div>

      <table class="amount-table">
        <thead>
          <tr>
            <th>Omschrijving</th>
            <th>Aantal</th>
            <th>Prijs per eenheid</th>
            <th>Totaal (excl. BTW)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ontwikkeling project: ${project.name}</td>
            <td>1</td>
            <td>€${amount.toFixed(2)}</td>
            <td>€${amount.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3"><strong>Subtotaal (excl. BTW)</strong></td>
            <td><strong>€${amount.toFixed(2)}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="3"><strong>BTW (21%)</strong></td>
            <td><strong>€${(amount * 0.21).toFixed(2)}</strong></td>
          </tr>
          <tr class="total-row" style="background-color: #007bff; color: white;">
            <td colspan="3"><strong>Totaal (incl. BTW)</strong></td>
            <td><strong>€${(amount * 1.21).toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="payment-info">
        <strong>Betalingsinformatie:</strong><br>
        Gelieve het factuurbedrag van €${(amount * 1.21).toFixed(2)} te voldoen binnen 30 dagen na factuurdatum.<br>
        ${developer.BTWNumber ? 'Betalingen zijn verschuldigd inclusief BTW.' : 'Geen BTW van toepassing.'}
      </div>

      <div class="footer">
        <div>Deze factuur is automatisch gegenereerd door Cliento Project Management systeem.</div>
        <div>Voor vragen over deze factuur kunt u contact opnemen via ${developer.email}</div>
      </div>
    </body>
    </html>
  `;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let browser;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Ongeldige project ID' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const projects = db.collection('projects');

    // Find current user
    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const currentUser = await users.findOne({ $or: [{ username }, { email }] });
    if (!currentUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Find project
    const project = await projects.findOne({ _id: new ObjectId(id) });
    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check if user has access to this project
    const userObjectId = currentUser._id;
    const hasAccess = 
      currentUser.role === 'developer' && (
        project.assignedDevelopers?.some((devId: ObjectId) => devId.toString() === userObjectId.toString()) ||
        project.createdBy?.toString() === userObjectId.toString()
      ) ||
      currentUser.role === 'klant' && project.clientId?.toString() === userObjectId.toString();

    if (!hasAccess) {
      return NextResponse.json({ error: 'Geen toegang tot dit project' }, { status: 403 });
    }

    // Get project details with populated data
    const projectWithDetails = await projects.aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedDevelopers',
          foreignField: '_id',
          as: 'developerDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: '_id',
          as: 'clientDetails'
        }
      }
    ]).toArray();

    if (!projectWithDetails.length) {
      return NextResponse.json({ error: 'Project details niet gevonden' }, { status: 404 });
    }

    const projectData = projectWithDetails[0];
    const developer = projectData.developerDetails?.[0];
    const clientData = projectData.clientDetails?.[0];

    if (!developer || !clientData) {
      return NextResponse.json({ error: 'Developer of klant gegevens ontbreken voor deze factuur' }, { status: 400 });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;
    
    // Use budget as amount, or default amount
    const amount = project.budget || 1000; // Default €1000 if no budget set

    // Generate HTML
    const htmlContent = generateInvoiceHTML(project, developer, clientData, invoiceNumber, amount);

    // Generate PDF using Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factuur-${invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (err) {
    console.error('Invoice generation error:', err);
    return NextResponse.json({ error: 'Kon factuur niet genereren' }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
    try { 
      await client.close(); 
    } catch {}
  }
}
