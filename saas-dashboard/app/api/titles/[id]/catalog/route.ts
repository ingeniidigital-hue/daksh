import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await params;
    const body = await request.json();
    
    // We route through Traefik which redirects /{TITLE_ID} to the correct pod
    const baseUrl = `http://localhost:8080/${titleId}`;
    const serverKey = 'defaultkey'; // Standard default Nakama server key

    // 1. Authenticate as a system user to get a session token
    const authResponse = await fetch(`${baseUrl}/v2/account/authenticate/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`
      },
      body: JSON.stringify({
        id: `daksh-system-catalog-${titleId}`,
        create: true,
        username: `daksh-system`
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error(`Auth Error (${authResponse.status}):`, errorText);
      return NextResponse.json({ error: 'Failed to authenticate with Nakama' }, { status: authResponse.status });
    }

    const { token } = await authResponse.json();

    // 2. Write the catalog data to Nakama Storage Engine
    const storageObjects = {
      objects: [
        {
          collection: "catalog",
          key: "items",
          value: JSON.stringify({ items: body.items || [] }),
          permission_read: 2, // Public Read
          permission_write: 0, // No Client Write
        },
        {
          collection: "catalog",
          key: "currencies",
          value: JSON.stringify({ currencies: body.currencies || [] }),
          permission_read: 2, // Public Read
          permission_write: 0, // No Client Write
        },
        {
          collection: "catalog",
          key: "lootboxes",
          value: JSON.stringify({ lootboxes: body.lootboxes || [] }),
          permission_read: 2,
          permission_write: 0,
        },
        {
          collection: "catalog",
          key: "bundles",
          value: JSON.stringify({ bundles: body.bundles || [] }),
          permission_read: 2,
          permission_write: 0,
        },
        {
          collection: "catalog",
          key: "stores",
          value: JSON.stringify({ stores: body.stores || [] }),
          permission_read: 2,
          permission_write: 0,
        },
        {
          collection: "catalog",
          key: "subscriptions",
          value: JSON.stringify({ subscriptions: body.subscriptions || [] }),
          permission_read: 2,
          permission_write: 0,
        },
        {
          collection: "catalog",
          key: "ugc",
          value: JSON.stringify({ items: body.ugcItems || [] }),
          permission_read: 2,
          permission_write: 0,
        }
      ]
    };

    const storageResponse = await fetch(`${baseUrl}/v2/storage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(storageObjects)
    });

    if (!storageResponse.ok) {
      const errorText = await storageResponse.text();
      console.error(`Storage Error (${storageResponse.status}):`, errorText);
      return NextResponse.json({ error: 'Failed to write catalog to Nakama' }, { status: storageResponse.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deploying catalog:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const { listCatalogItems, listCurrencies } = await import('@/lib/economy');
  const items = listCatalogItems(titleId);
  const currencies = listCurrencies(titleId);

  return NextResponse.json({
    titleId,
    totalItems: items.length,
    items,
    currencies
  });
}

