import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has data
    const existingSettings = await db.dashboardSettings.count({
      where: { userId: user.id },
    });
    const existingSites = await db.site.count({
      where: { userId: user.id },
    });

    if (existingSettings > 0 || existingSites > 0) {
      return NextResponse.json({ message: 'Database already seeded for this user' });
    }

    // Seed default settings for this user
    const defaultSettings = [
      { key: 'dashboardName', value: 'لوحة مواقعي', userId: user.id },
      { key: 'greeting', value: 'أهلاً وسهلاً', userId: user.id },
      { key: 'userName', value: '', userId: user.id },
    ];

    await db.dashboardSettings.createMany({
      data: defaultSettings,
    });

    // Seed example sites for this user
    const exampleSites = [
      {
        name: 'متتبع العادات',
        url: 'https://example.com/habit-tracker',
        description: 'تطبيق لمتابعة العادات اليومية وتحقيق الأهداف',
        category: 'شخصي',
        iconColor: '#059669',
        order: 0,
        userId: user.id,
      },
      {
        name: 'المدونة الشخصية',
        url: 'https://example.com/blog',
        description: 'مدونة شخصية للمقالات والملاحظات',
        category: 'شخصي',
        iconColor: '#0891b2',
        order: 1,
        userId: user.id,
      },
    ];

    await db.site.createMany({
      data: exampleSites,
    });

    return NextResponse.json({ message: 'Database seeded successfully for user' }, { status: 201 });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
