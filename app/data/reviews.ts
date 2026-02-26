/**
 * Customer reviews for Southern Tree Services.
 * Used for testimonial carousel and JSON-LD (LocalBusiness.review, aggregateRating).
 */

export interface Review {
  reviewer: string;
  reviewDate: string; // display string, e.g. "a week ago"
  reviewText: string;
  ownerResponse?: string;
  /** ISO date for schema.org datePublished; undefined if unknown */
  datePublished?: string;
}

/** Map relative review date string to approximate ISO date (for schema.org). Base: 2025-02-24 */
function toIsoDate(relative: string): string | undefined {
  const map: Record<string, string> = {
    "Unknown": "",
    "a week ago": "2025-02-17",
    "2 weeks ago": "2025-02-10",
    "2 months ago": "2024-12-24",
    "5 months ago": "2024-09-24",
    "6 months ago": "2024-08-24",
    "7 months ago": "2024-07-24",
    "8 months ago": "2024-06-24",
    "11 months ago": "2024-03-24",
    "a year ago": "2024-02-24",
    "2 years ago": "2023-02-24",
    "3 years ago": "2022-02-24",
  };
  const normalized = relative.trim();
  const iso = map[normalized];
  if (iso === "") return undefined;
  return iso || undefined;
}

export const reviews: Review[] = [
  { reviewer: "New World Strategies", reviewDate: "Unknown", reviewText: "The dreadful ice we had in Memphis caused some of our trees to fall blocking our parking lot - Peter made sure we got back to business as soon as possible - will definitely use again", datePublished: toIsoDate("Unknown") },
  { reviewer: "Brenden Foster", reviewDate: "a week ago", reviewText: "Reasonable price. Southern Tree and Renovations did a great job removing our giant old oak tree. It was situated between some power lines, a major road, and the house so it wasn't the easiest cut. We were impressed with their speed of execution and quality … More", datePublished: toIsoDate("a week ago") },
  { reviewer: "Tonya Bosley", reviewDate: "2 weeks ago", reviewText: "The recent ice storm led to many trees needing to be trimmed and cut on my property. A friend referred me to Southern Tree & Renovations for help. I had an EXCELLENT experience with this tree trimming company! From the quick response to … More", datePublished: toIsoDate("2 weeks ago") },
  { reviewer: "Princess Rodgers", reviewDate: "2 weeks ago", reviewText: "Great price,", datePublished: toIsoDate("2 weeks ago") },
  { reviewer: "Tristan Rogerson", reviewDate: "2 months ago", reviewText: "These guys came to my parents house in Memphis and removed a large tree for an affordable price. Highly recommend calling them!", datePublished: toIsoDate("2 months ago") },
  { reviewer: "MB Bacari", reviewDate: "5 months ago", reviewText: "Always good work. Always quick and clean.", ownerResponse: "Thank you for your positive feedback!", datePublished: toIsoDate("5 months ago") },
  { reviewer: "Talmadge Beats", reviewDate: "5 months ago", reviewText: "Thank you for helping with my tree removal! Great service! Services: … More", ownerResponse: "Thank you! Happy to help!", datePublished: toIsoDate("5 months ago") },
  { reviewer: "Bryce Burns", reviewDate: "5 months ago", reviewText: "Peter is the best in the business. Available at the drop of a hat, professionally sound, and as ethical as they come. I would recommend his services to anyone.", ownerResponse: "Thank you Bryce! Happy to help with your tree removal!", datePublished: toIsoDate("5 months ago") },
  { reviewer: "Barry Blancq", reviewDate: "5 months ago", reviewText: "Very responsive and great pricing!", ownerResponse: "Thank you Barry! Happy to help with your tree work!", datePublished: toIsoDate("5 months ago") },
  { reviewer: "Donna Henderson", reviewDate: "6 months ago", reviewText: "I manage an old apartment complex and we have a lot of big, huge, beautiful old trees on our property. There were several trees that needed some attention. Peter was so patient after he first came out and gave me an estimate because the … More", ownerResponse: "Thank you Donna! We are more than happy to help any time!", datePublished: toIsoDate("6 months ago") },
  { reviewer: "Barbara Wilkerson", reviewDate: "7 months ago", reviewText: "If any one needs something done to their trees I Recommend Southern Tree and Renovation Those guys are Great they'did a Awesome Job Thanks,you Give them a call, you will be Glad you did very Friendly Thank,you for Service.", ownerResponse: "Thank you Barbara! Happy to help!", datePublished: toIsoDate("7 months ago") },
  { reviewer: "Ronny Cox", reviewDate: "7 months ago", reviewText: "They came out same day and took care of our tree and two stumps. I shopped around and they were the most affordable by far, but still very professional and helpful. I'd use them again 100%.", ownerResponse: "Thank you Ronny for your positive feedback!", datePublished: toIsoDate("7 months ago") },
  { reviewer: "Timothy Bing", reviewDate: "7 months ago", reviewText: "Great customer service, always on time, I highly recommend these guys. Pete was very helpful and made sure to always keep me updated!", ownerResponse: "Thank you Timothy happy to help!", datePublished: toIsoDate("7 months ago") },
  { reviewer: "Sierra Brown", reviewDate: "8 months ago", reviewText: "Team was very hardworking and safe trimming the two massive oak trees near our house. Great to work with and reasonably priced.", ownerResponse: "Thank you Sierra!", datePublished: toIsoDate("8 months ago") },
  { reviewer: "Vicki Wallace", reviewDate: "8 months ago", reviewText: "These guys did an awesome job trimming my trees and hedges. They responded to my request very quickly and efficiently. I appreciate them for cleaning up the surrounding area after they were finished. The price was very reasonable. I would highly recommend Southern Tree to anyone. Great company, great people.", ownerResponse: "Thank you Vicki! We are more than happy to help you with any tree work in the future!", datePublished: toIsoDate("8 months ago") },
  { reviewer: "Michael Gardner", reviewDate: "11 months ago", reviewText: "These guys are PROS! They built a 60 ft. fence and pruned a gigantic tree in the backyard, after a resent storm…..all in the same day! Great communication and awesome people. I highly recommend Southern Tree. 10 stars.", ownerResponse: "Thank you Michael!", datePublished: toIsoDate("11 months ago") },
  { reviewer: "Gladys Houston", reviewDate: "11 months ago", reviewText: "The workers did a wonderful job. On time, very efficient. Very affordable price. Real happy with.the outcome.", ownerResponse: "Thank you Gladys! Happy to help anytime!", datePublished: toIsoDate("11 months ago") },
  { reviewer: "Marti Carty", reviewDate: "a year ago", reviewText: "I had some limbs trimmed today and they did a great job! Punctual. Efficient. Cleaned up afterwards. Very reasonably priced too! Highly recommend!!", ownerResponse: "Thank you Marti! Happy to help with your tree trimming needs!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Steph Rollen", reviewDate: "a year ago", reviewText: "The crew did a great job, were careful and cleaned up when they were done. Communication was good and we will certainly recommend this business.", ownerResponse: "Thank you Steph for your positive feedback!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Trish Fannon", reviewDate: "a year ago", reviewText: "I paid a fair price and they did excellent work! They even cleaned up after themselves. I would highly recommend.", ownerResponse: "Thank you Trish! Happy to help!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Kirstin Mccrary", reviewDate: "a year ago", reviewText: "Removed 3 large trees for me and did a fantastic job!", ownerResponse: "Thank you! Happy to help with your tree removals!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Matt Wallace (General Contractor)", reviewDate: "a year ago", reviewText: "Southern Tree has done a great job for me many times. They are my \"Go To\" for all our tree removal work!", ownerResponse: "Thank you Matt! Always happy to help you with your tree service needs!", datePublished: toIsoDate("a year ago") },
  { reviewer: "JT S", reviewDate: "a year ago", reviewText: "Very good service and great price. They have done tree removal and also replaced a fence. Would highly recommend them.", datePublished: toIsoDate("a year ago") },
  { reviewer: "Jack Goodman", reviewDate: "a year ago", reviewText: "Peter and his crew showed up when scheduled did a good job and cleaned up afterwards. The price was reasonable and the workman were professional. Thanks", datePublished: toIsoDate("a year ago") },
  { reviewer: "Holden Kidd", reviewDate: "a year ago", reviewText: "Came out and cut a bunch of limbs down for me overhanging the road to my house. Did a great job", datePublished: toIsoDate("a year ago") },
  { reviewer: "Abigail Mosk", reviewDate: "a year ago", reviewText: "Great quality service. Worked quick and got the job done well.", datePublished: toIsoDate("a year ago") },
  { reviewer: "Karnisha Bates", reviewDate: "a year ago", reviewText: "Great service!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Nico Nordin", reviewDate: "a year ago", reviewText: "Removal 2 trees for my family and they did amazing job! Highly recommend!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Claudia Villar", reviewDate: "a year ago", reviewText: "Southern Tree and renovations did a great job removing a dead tree by our Church. Peter kept us informed, They did the job on time. Affordable price and great service!", ownerResponse: "Thank you Claudia for your positive words! It was a pleasure and happy to help anytime!", datePublished: toIsoDate("a year ago") },
  { reviewer: "James Gibbs", reviewDate: "a year ago", reviewText: "They removed my trees at efficient time and at good price . No problems at all, great service. I will use again.", ownerResponse: "Thank you James for the positive feedback!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Katie Rowe", reviewDate: "a year ago", reviewText: "Best customer service ever. Highly recommend!", ownerResponse: "Thank you! Happy to help!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Barrett Jones", reviewDate: "a year ago", reviewText: "These guys are awesome. Very easy to communicate with, fair pricing, and did an awesome job with cleanup after the job was done.", ownerResponse: "Thank you Barrett for the positive feedback! Happy to help anytime!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Eddie Dattel", reviewDate: "a year ago", reviewText: "Peter cares about his customers and takes good care of them. I've used him twice and have been very pleased.", ownerResponse: "Thank you for your positive feedback!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Naz Yazdi", reviewDate: "a year ago", reviewText: "Southern trees ad renovations team were great. Peter and his crew Aidan, Enrique, and Gustavo did a great job on cutting our dead trees and branches. The job was handlede professionally and in the best way possible. Their price was … More", ownerResponse: "Thanks you for the positive feedback! We are more than happy to help anytime!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Jessie May", reviewDate: "a year ago", reviewText: "Peter and Austin with Southern Tree were both wonderful to work with. The scope of the job was a huge undertaking and they did fantastic work... at an even better than fantastic rate. Real Quality Work with loyal prices. These guys are … More", ownerResponse: "Thank you for your positive feedback! We look forward to assisting you with any tree service needs you may have in the future!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Christopher Perry", reviewDate: "a year ago", reviewText: "I hired Southern Tree and Renovations to remove a large dead tree limb and some other tree limbs that were hanging over my roof. They were a great crew! They came out quickly to give me an estimate (which was the lowest bid I received from … More", ownerResponse: "Thank you for your positive feedback! We are more than happy to help with any of your tree service needs in the future!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Guguie Benabe", reviewDate: "a year ago", reviewText: "It was a pleasure doing business with Southern Tree and Renovations; they have my highest recommendation! They provided a very fair quote, got started right away, and were professional and efficient. They took down a whole tree by my … More", ownerResponse: "Thank you for your feedback! We are happy to help anytime!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Cherry FN", reviewDate: "a year ago", reviewText: "I highly recommend Southern Tree and Renovations for any tree removal needs. Their combination of responsiveness, professionalism, and excellent service made the entire experience smooth and hassle-free.", ownerResponse: "Thank you so much for your positive feedback! We are more than willing to help with any of your tree removal needs anytime!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Jake Victor", reviewDate: "a year ago", reviewText: "They removed some trees over my roof in Germantown, that would have damaged my house eventually. Guys were very nice and respectful. Would recommend!", ownerResponse: "Thank you Jake for your Positive Feedback! We are more than happy to help with your tree removal needs in the future!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Preston Myers", reviewDate: "a year ago", reviewText: "Did a great job removing trees at my families home in Collierville. Quick and clean.", ownerResponse: "Thank you Mr. Myers, we were more than happy to help with your tree removals!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Keon Zimmerman", reviewDate: "a year ago", reviewText: "Needed a lot of trimming done for 3 large oak trees. This team was efficient, timely, and great communicators. They consistently checked-in to make sure they were getting the limbs I needed. When they had recommendations on potentially … More", ownerResponse: "Thank you Mr. Zimmerman! We appreciate your positive review and more than happy to help with your tree trimming needs!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Alyson Berliner", reviewDate: "a year ago", reviewText: "These guys cut down two large trees for my family! They did an amazing job and had very fair prices. I would highly recommend them and will be calling anytime I need tree work!", ownerResponse: "Thank you Alyson! We appreciate your review and recommendation!", datePublished: toIsoDate("a year ago") },
  { reviewer: "Soheila Kail", reviewDate: "2 years ago", reviewText: "Southern tree team did terrific job. They cleaned up after the work was done. They were on time and they worked hard. I will recommend them to anyone that needs the tree work.", ownerResponse: "Thank you Soheila! It was a pleasure taking care of your tree service needs!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Charlotte Myers", reviewDate: "2 years ago", reviewText: "The Best…the absolute Best!!! I had them cut down two big trees and trim numerous other trees. It was the easiest and best experience ever. The owner and his team are extremely professional and proficient in their work. The best and … More", ownerResponse: "Thank you Mrs. Myers! It was a pleasure taking care of you! We appreciate your kind words and always here to help!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Austin Harris", reviewDate: "2 years ago", reviewText: "They're team was prompt, professional, and did an excellent job at removing four trees in my yard. Would highly recommend", ownerResponse: "Thanks Austin! It was a pleasure taking care of your tree removals! We are always here to help!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Archie Mckinney", reviewDate: "2 years ago", reviewText: "Great service! They took out a large tree for me and did a great job! Highly recommend them to anyone needing tree work!", ownerResponse: "Thank you Archie for your kind words! Feel free to give us a call for any future tree work! We'll be more than happy to help!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Dunn Burch", reviewDate: "2 years ago", reviewText: "Fast, reliable; same day service! This was a last minute request (large tree limb suddenly fell in my pool this morning). Southern Tree was quick to respond to my text & price was fair. I would definitely use Southern Tree & Renovations again!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Danny Kail", reviewDate: "2 years ago", reviewText: "Fast and efficient! Highly recommend!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "McKenzie Cole", reviewDate: "2 years ago", reviewText: "Did a great job! Will call again!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Austin Kenney", reviewDate: "2 years ago", reviewText: "Southern Tree is definitely the company to use! Peter were quick to get out to my place for a quote and finished removing the fallen tree in one day. Very competitive pricing as well! Highly recommended", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Msgator87", reviewDate: "2 years ago", reviewText: "Great service! Dependable and reasonable price.", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Taylor Treas", reviewDate: "2 years ago", reviewText: "Highly recommend using Southern Tree! Very professional, great customer service, and ongoing communication throughout the entire process. I will definitely be using them for all of my future needs!", datePublished: toIsoDate("2 years ago") },
  { reviewer: "Kenny Smith", reviewDate: "2 years ago", reviewText: "I had a tree fall on my house. The owner went to my house immediately and had a quote for me within a couple of hours. He then has one of his crews there within a short period of time and the work was done - they cleaned up and it looked … More", datePublished: toIsoDate("2 years ago") },
  { reviewer: "David Van Epps", reviewDate: "3 years ago", reviewText: "Peter was very professional and courteous. The cost was very competitive. My high bid, out of 3 bids, was 1200.00 more than Southern Tree for the same … More", datePublished: toIsoDate("3 years ago") },
  { reviewer: "Olivia Brommer", reviewDate: "3 years ago", reviewText: "We had a tree fall and Southern came out almost immediately. Their service was amazing!", datePublished: toIsoDate("3 years ago") },
  { reviewer: "Torbir Dhaliwal", reviewDate: "3 years ago", reviewText: "Good price and decent service", datePublished: toIsoDate("3 years ago") },
  { reviewer: "Mark Horobetz", reviewDate: "3 years ago", reviewText: "This crew managed by Peter Allen were phenomenal. They showed up on time and worked hard until they couldn't see anymore. I would highly recommend!", datePublished: toIsoDate("3 years ago") },
  { reviewer: "Katherine Warner", reviewDate: "3 years ago", reviewText: "We had a big limb hanging over our driveway, blocking our driveway and garage. We called Peter on Saturday morning and he sent his crew out that afternoon and took it down for us. His pricing was very reasonable as we called 3 tree … More", datePublished: toIsoDate("3 years ago") },
  { reviewer: "Sandra Paris", reviewDate: "3 years ago", reviewText: "Super professional- quick, thorough, and overall did a fantastic job. Would recommend!", datePublished: toIsoDate("3 years ago") },
  { reviewer: "Mike Reagan", reviewDate: "3 years ago", reviewText: "Peter did an outstanding job with the fast crew who arrived the next day and were finished with the whole job in 1hour. That included hauling it away too. I give them 5 stars !!!", datePublished: toIsoDate("3 years ago") },
];

/** Reviews that have non-empty review text (for carousel). */
export const reviewsWithText = reviews.filter((r) => r.reviewText.trim().length > 0);

/** For JSON-LD: top N reviews (Google often shows a subset). */
export const REVIEWS_FOR_SCHEMA = 10;

/** Aggregate rating for schema: 5 stars, count = number of reviews. */
export function getAggregateRatingSchema() {
  return {
    "@type": "AggregateRating",
    ratingValue: "5",
    bestRating: "5",
    worstRating: "1",
    reviewCount: String(reviews.length),
  };
}

/** Schema.org Review objects for LocalBusiness.review (subset with datePublished preferred). */
export function getReviewSchemaItems(review: Review) {
  const author = review.reviewer.trim() || "Customer";
  const item: Record<string, unknown> = {
    "@type": "Review",
    author: { "@type": "Person", name: author },
    reviewBody: review.reviewText.trim(),
  };
  if (review.datePublished) item.datePublished = review.datePublished;
  return item;
}
