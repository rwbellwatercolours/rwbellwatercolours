/* ==========================================================================
   SITE SETTINGS

   Name, email, social links, and the words on the About page.
   Edit the text between the quote marks. Keep the quote marks and commas.
   ========================================================================== */

window.SITE = {
  // Shown in the top-left of every page, in the footer, and in the browser tab.
  name: "Robert W. Bell",

  // Appears after the name in the browser tab,
  // e.g. "Robert W. Bell — Watercolours"
  tagline: "Watercolours",

  // Used for search engines and link previews.
  description:
    "Original watercolour paintings by Robert W. Bell.",

  // Shown in the footer. Clicking it opens the visitor's email app.
  email: "robertwalkerbell@gmail.com",

  // Social links. Empty, so the footer's "Social" column is hidden entirely.
  // To bring it back, add a line in this shape — one per account:
  //   { label: "Instagram", url: "https://www.instagram.com/your-name/" },
  social: [],

  // The About page.
  about: {
    // Photographs down the right-hand side, in this order. Add or remove
    // lines freely, or use an empty list — portraits: [] — for text only.
    portraits: [
      {
        src: "images/portrait-02.avif",
        width: 2044,
        height: 1547,
        title: "Indian Head Cove, Bruce Peninsula",
        alt: "Robert W. Bell in a sun hat on a limestone shoreline, clear green water behind him.",
      },
      {
        src: "images/portrait-01.avif",
        width: 1898,
        height: 1547,
        title: "Cabbagetown Art & Crafts Exhibition",
        alt: "Robert W. Bell at his show booth, watercolours hung on the walls around him.",
      },
    ],

    // Each string below becomes its own paragraph.
    paragraphs: [
      "I live in Toronto with my wife and two sons. I am a retired lawyer and serve on the board of the Fort York Foundation and as Secretary to the Board of the Toronto Watercolour Society and as a member of its Executive Committee.",
      "I began painting in watercolour, as a hobby in 2017. I have taken courses, and continue to do so, with professional painter and printmaker, Brian Hoxha through the Art Gallery of Ontario, Toronto School of Art and the Toronto School Board.",
      "My art focuses primarily on landscape and domestic scenes (our two family cats figure prominently!). I strive for realism that takes full advantage of the unique qualities and unanticipated surprises of the watercolour medium. For everyone entranced by watercolour - it’s all about the luminous light!",
      "I typically work from my own reference photos taken around the city and beyond (e.g. the Beaches, Don Valley Brick Works, Lake Simcoe, Bruce Peninsula, Cape Cod, the Hamptons). Scenes from these locations have been well represented in public showings since 2019 at the Cabbagetown Art & Crafts exhibition, Riverdale ArtWalk, and at Toronto Watercolour Society and other local shows.",
      "You can see my art on this website and at instagram.com/robertwalkerbell.",
    ],

    // The art bio, printed under the paragraphs above. Each block is one
    // heading and its list. Add a new entry, or a new line inside "items",
    // and it appears automatically — nothing else needs changing.
    cv: [
      {
        heading: "Art Education",
        items: [
          "In-class, plein air, and virtual instruction since 2017 with watercolour artist and printmaker, Brian Hoxha, through Art Gallery of Ontario, Toronto School of Art, and Toronto District School Board",
        ],
      },
      {
        heading: "Art Society Memberships",
        items: [
          "Toronto Watercolour Society (“TWS”) (Secretary to the Board & Executive Committee from April 2025)",
          "International Watercolor Society Canada",
        ],
      },
      {
        heading: "Juried Exhibitions",
        items: [
          "Fall, 2025 - TWS Aquavision, online show",
          "Spring, 2025 - TWS Aquavision, Serpa Gallery, Newmarket",
          "Fall, 2024 - TWS Aquavision, Papermill Gallery, Todmorden Mills",
          "Spring, 2024 - TWS Aquavision, Neilson Park Creative Centre, Etobicoke",
          "Fall, 2023 - TWS Aquavision, Papermill Gallery, Todmorden Mills",
          "Spring, 2023 - TWS Aquavision, Serpa Gallery, Newmarket",
          "Fall, 2022 - TWS - Fall Aquavision 2022, Papermill Gallery, Todmorden Mills",
          "Spring, 2022 - TWS Aquavision, Papermill Gallery, Todmorden Mills",
          "Fall, 2021 - TWS Aquavision, Papermill Gallery, Todmorden Mills",
          "June 2022 and 2023 - Riverdale ArtWalk - Jimmie Simpson Park",
          "Sept, 2019, 2021, 2022, 2023 & 2024 - Cabbagetown Art and Crafts Sale, Riverdale Park",
          "Nov 16 - Dec 4, 2022 - Life Doesn’t Stand Still Group Exhibition - Leslie Grove Gallery, Toronto",
        ],
      },
      {
        heading: "Non-Juried Exhibitions",
        items: [
          "Apr 9 - May 4, 2025 - TWS Artists' Choice, Papermill Gallery, Todmorden Mills",
          "Oct 14 - Nov 9, 2023 - Emerging Expressions, Toronto School of Art",
          "March 15 - April 2, 2023 - The Watercolour Show at Gerrard Art Space, Toronto",
          "Oct 8, 2022 - De Grassi Point Art Show, Lake Simcoe",
        ],
      },
      {
        heading: "Awards",
        items: [
          "Gold Medal Award for Something’s Brewing - Toronto Watercolour Society, Spring Aquavision, 2022 [Juror: Merv Richardson, CSPWC, OSA]",
        ],
      },
    ],
  },

  // Small print at the very bottom of every page.
  footerNote: "©2026 Robert W. Bell. All Rights Reserved.",
};
