const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const REGIONS = [
  { name: "서울", slug: "seoul" }, { name: "부산", slug: "busan" },
  { name: "대구", slug: "daegu" }, { name: "인천", slug: "incheon" },
  { name: "광주", slug: "gwangju" }, { name: "대전", slug: "daejeon" },
  { name: "울산", slug: "ulsan" }, { name: "세종", slug: "sejong" },
  { name: "경기", slug: "gyeonggi" }, { name: "강원", slug: "gangwon" },
  { name: "충북", slug: "chungbuk" }, { name: "충남", slug: "chungnam" },
  { name: "전북", slug: "jeonbuk" }, { name: "전남", slug: "jeonnam" },
  { name: "경북", slug: "gyeongbuk" }, { name: "경남", slug: "gyeongnam" },
  { name: "제주", slug: "jeju" }
];

const SAMPLE_PLACES = [
  {
    regionSlug: "seoul",
    name: "을지로 냉면집",
    slug: "euljiro-naengmyeon",
    reviews: [
      { rating: 5.0, content: "국물이 미쳤다!" },
      { rating: 4.5, content: "면발 탱글~" }
    ]
  },
  {
    regionSlug: "seoul",
    name: "망원동 라멘",
    slug: "mangwon-ramen",
    reviews: [
      { rating: 4.5, content: "진한 돈코츠 국물" },
      { rating: 4.0, content: "차슈가 맛있음" }
    ]
  },
  {
    regionSlug: "busan",
    name: "남포동 밀면",
    slug: "nampodong-milmyeon",
    reviews: [
      { rating: 4.2, content: "시원하고 가성비 굿" }
    ]
  }
];

async function upsertRegions() {
  for (const r of REGIONS) {
    await prisma.region.upsert({
      where: { slug: r.slug },
      update: {},
      create: r
    });
  }
}

async function seedPlaces() {
  for (const p of SAMPLE_PLACES) {
    const region = await prisma.region.findUnique({ where: { slug: p.regionSlug }});
    if (!region) continue;

    // place + reviews 생성
    const created = await prisma.place.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        regionId: region.id,
        reviews: { create: p.reviews }
      },
      include: { reviews: true }
    });

    // avgRating / reviewsCount 계산 후 업데이트
    const sum = created.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = created.reviews.length ? sum / created.reviews.length : 0;
    await prisma.place.update({
      where: { id: created.id },
      data: { avgRating: Math.round(avg * 10) / 10, reviewsCount: created.reviews.length }
    });
  }
}

async function main() {
  await upsertRegions();
  await seedPlaces();
  console.log("✅ Regions & sample places seeded");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
