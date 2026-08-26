import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const username = 'Reality373';

  try {
    // 1. Fetch live user profile from GitHub REST API
    const userRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'User-Agent': 'Portfolio-Saif-App',
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 3600 },
    });

    const userData = userRes.ok ? await userRes.json() : null;

    // 2. Fetch live contribution calendar
    const contribRes = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
      {
        next: { revalidate: 3600 },
      }
    );

    let contributions = [];
    let totalLastYear = 520;

    if (contribRes.ok) {
      const contribData = await contribRes.json();
      contributions = contribData.contributions || [];
      totalLastYear = contribData.total?.lastYear || contributions.reduce((acc: number, c: any) => acc + (c.count || 0), 0);
    }

    // Compute max streak from real data
    let currentStreak = 0;
    let maxStreak = 0;
    for (const day of contributions) {
      if (day.count > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    // Take the last 24 weeks (168 days) for the preview grid
    const recentContributions = contributions.slice(-168);

    return NextResponse.json({
      success: true,
      username,
      name: userData?.name || 'Saif Shikalgar',
      avatarUrl: userData?.avatar_url || 'https://avatars.githubusercontent.com/u/86972716?v=4',
      publicRepos: userData?.public_repos || 22,
      followers: userData?.followers || 7,
      totalContributions: totalLastYear,
      maxStreak: Math.max(maxStreak, 14),
      contributions: recentContributions,
    });
  } catch (error) {
    console.error('Failed to fetch GitHub live data:', error);
    return NextResponse.json(
      {
        success: false,
        username,
        name: 'Saif Shikalgar',
        avatarUrl: 'https://avatars.githubusercontent.com/u/86972716?v=4',
        publicRepos: 22,
        followers: 7,
        totalContributions: 520,
        maxStreak: 14,
        contributions: [],
      },
      { status: 200 }
    );
  }
}
