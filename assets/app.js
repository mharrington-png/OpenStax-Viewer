/* MX Algebra reader — shared behavior */

/* ---------- book manifests ----------
   Keyed by book id. Each page declares which book it belongs to via
   <body data-book="...">; missing/unset defaults to "college-algebra-2e" so
   existing pages built before multi-book support keep working unchanged.
   `sectionsDir` is the path (relative to site root) where that book's section
   files live — every book (including College Algebra 2e) is scoped under
   sections/<book-id>/ to avoid chapter-number collisions (e.g. Calculus Vol 1's
   own Chapter 2). */
const BOOKS = {
  "college-algebra-2e": {
    title: "College Algebra",
    license: { name: "Creative Commons Attribution 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    source: { name: "OpenStax College Algebra 2e", url: "https://openstax.org/books/college-algebra-2e", author: "Jay Abramson" },
    sectionsDir: "sections/college-algebra-2e",
    chapters: [
      { n: 2, title: "Equations and Inequalities", sections: [
        { id: "2-1", title: "2.1 The Rectangular Coordinate Systems and Graphs", file: "2-1.html", ready: true },
        { id: "2-2", title: "2.2 Linear Equations in One Variable", file: "2-2.html", ready: true },
        { id: "2-3", title: "2.3 Models and Applications", file: "2-3.html", ready: true },
        { id: "2-4", title: "2.4 Complex Numbers", file: "2-4.html", ready: true },
        { id: "2-5", title: "2.5 Quadratic Equations", file: "2-5.html", ready: true },
        { id: "2-6", title: "2.6 Other Types of Equations", file: "2-6.html", ready: true },
        { id: "2-7", title: "2.7 Linear Inequalities and Absolute Value Inequalities", file: "2-7.html", ready: true },
        { id: "2-7-review", title: "Chapter Review Exercises", file: "2-7.html#chapter-review-exercises", ready: true },
        { id: "2-7-practice", title: "Chapter Practice Test", file: "2-7.html#chapter-practice-test", ready: true },
      ]},
      { n: 3, title: "Functions", sections: [
        { id: "3-1", title: "3.1 Functions and Function Notation", file: "3-1.html", ready: true },
        { id: "3-2", title: "3.2 Domain and Range", file: "3-2.html", ready: true },
        { id: "3-3", title: "3.3 Rates of Change and Behavior of Graphs", file: "3-3.html", ready: true },
        { id: "3-4", title: "3.4 Composition of Functions", file: "3-4.html", ready: true },
        { id: "3-5", title: "3.5 Transformation of Functions", file: "3-5.html", ready: true },
        { id: "3-6", title: "3.6 Absolute Value Functions", file: "3-6.html", ready: true },
        { id: "3-7", title: "3.7 Inverse Functions", file: "3-7.html", ready: true },
        { id: "3-7-review", title: "Chapter Review Exercises", file: "3-7.html#chapter-review-exercises", ready: true },
        { id: "3-7-practice", title: "Chapter Practice Test", file: "3-7.html#practice-test", ready: true },
      ]},
      { n: 4, title: "Linear Functions", sections: [
        { id: "4-1", title: "4.1 Linear Functions", file: "4-1.html", ready: true },
        { id: "4-2", title: "4.2 Modeling with Linear Functions", file: "4-2.html", ready: true },
        { id: "4-3", title: "4.3 Fitting Linear Models to Data", file: "4-3.html", ready: true },
        { id: "4-3-review", title: "Chapter Review Exercises", file: "4-3.html#chapter-review-exercises", ready: true },
        { id: "4-3-practice", title: "Chapter Practice Test", file: "4-3.html#chapter-practice-test", ready: true },
      ]},
      { n: 5, title: "Polynomial and Rational Functions", sections: [
        { id: "5-1", title: "5.1 Quadratic Functions", file: "5-1.html", ready: true },
        { id: "5-2", title: "5.2 Power Functions and Polynomial Functions", file: "5-2.html", ready: true },
        { id: "5-3", title: "5.3 Graphs of Polynomial Functions", file: "5-3.html", ready: true },
        { id: "5-4", title: "5.4 Dividing Polynomials", file: "5-4.html", ready: true },
        { id: "5-5", title: "5.5 Zeros of Polynomial Functions", file: "5-5.html", ready: true },
        { id: "5-6", title: "5.6 Rational Functions", file: "5-6.html", ready: true },
        { id: "5-7", title: "5.7 Inverses and Radical Functions", file: "5-7.html", ready: true },
        { id: "5-8", title: "5.8 Modeling Using Variation", file: "5-8.html", ready: true },
        { id: "5-8-review", title: "Chapter Review Exercises", file: "5-8.html#chapter-review-exercises", ready: true },
        { id: "5-8-practice", title: "Chapter Practice Test", file: "5-8.html#chapter-test", ready: true },
      ]},
      { n: 6, title: "Exponential and Logarithmic Functions", sections: [
        { id: "6-1", title: "6.1 Exponential Functions", file: "6-1.html", ready: true },
        { id: "6-2", title: "6.2 Graphs of Exponential Functions", file: "6-2.html", ready: true },
        { id: "6-3", title: "6.3 Logarithmic Functions", file: "6-3.html", ready: true },
        { id: "6-4", title: "6.4 Graphs of Logarithmic Functions", file: "6-4.html", ready: true },
        { id: "6-5", title: "6.5 Logarithmic Properties", file: "6-5.html", ready: true },
        { id: "6-6", title: "6.6 Exponential and Logarithmic Equations", file: "6-6.html", ready: true },
        { id: "6-7", title: "6.7 Exponential and Logarithmic Models", file: "6-7.html", ready: true },
        { id: "6-8", title: "6.8 Fitting Exponential Models to Data", file: "6-8.html", ready: true },
        { id: "6-8-review", title: "Chapter Review Exercises", file: "6-8.html#chapter-review-exercises", ready: true },
        { id: "6-8-practice", title: "Chapter Practice Test", file: "6-8.html#practice-test", ready: true },
      ]},
    ],
  },
  "calculus-v1": {
    title: "Calculus Volume 1",
    // NC-SA, unlike College Algebra 2e's CC BY — confirmed on the book's openstax.org
    // page (openstax.org/details/books/calculus-volume-1). Never let this book's
    // footer show a plain "CC BY" license — see CLAUDE.md convention 3/README license note.
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Calculus Volume 1", url: "https://openstax.org/books/calculus-volume-1", author: "Gilbert Strang, Edwin “Jed” Herman" },
    sectionsDir: "sections/calculus-v1",
    chapters: [
      { n: 1, title: "Functions and Graphs", sections: [
        { id: "1-1", title: "1.1 Review of Functions", file: "1-1.html", ready: false },
        { id: "1-2", title: "1.2 Basic Classes of Functions", file: "1-2.html", ready: false },
        { id: "1-3", title: "1.3 Trigonometric Functions", file: "1-3.html", ready: false },
        { id: "1-4", title: "1.4 Inverse Functions", file: "1-4.html", ready: false },
        { id: "1-5", title: "1.5 Exponential and Logarithmic Functions", file: "1-5.html", ready: false },
      ]},
      { n: 2, title: "Limits", sections: [
        { id: "2-1", title: "2.1 A Preview of Calculus", file: "2-1.html", ready: true },
        { id: "2-2", title: "2.2 The Limit of a Function", file: "2-2.html", ready: true },
        { id: "2-3", title: "2.3 The Limit Laws", file: "2-3.html", ready: true },
        { id: "2-4", title: "2.4 Continuity", file: "2-4.html", ready: true },
        { id: "2-5", title: "2.5 The Precise Definition of a Limit", file: "2-5.html", ready: true },
        { id: "2-5-review", title: "Chapter Review Exercises", file: "2-5.html#chapter-review-exercises", ready: true },
      ]},
      { n: 3, title: "Derivatives", sections: [
        { id: "3-1", title: "3.1 Defining the Derivative", file: "3-1.html", ready: true },
        { id: "3-2", title: "3.2 The Derivative as a Function", file: "3-2.html", ready: true },
        { id: "3-3", title: "3.3 Differentiation Rules", file: "3-3.html", ready: true },
        { id: "3-4", title: "3.4 Derivatives as Rates of Change", file: "3-4.html", ready: true },
        { id: "3-5", title: "3.5 Derivatives of Trigonometric Functions", file: "3-5.html", ready: false },
        { id: "3-6", title: "3.6 The Chain Rule", file: "3-6.html", ready: false },
        { id: "3-7", title: "3.7 Derivatives of Inverse Functions", file: "3-7.html", ready: false },
        { id: "3-8", title: "3.8 Implicit Differentiation", file: "3-8.html", ready: false },
        { id: "3-9", title: "3.9 Derivatives of Exponential and Logarithmic Functions", file: "3-9.html", ready: false },
      ]},
      { n: 4, title: "Applications of Derivatives", sections: [
        { id: "4-1", title: "4.1 Related Rates", file: "4-1.html", ready: false },
        { id: "4-2", title: "4.2 Linear Approximations and Differentials", file: "4-2.html", ready: false },
        { id: "4-3", title: "4.3 Maxima and Minima", file: "4-3.html", ready: false },
        { id: "4-4", title: "4.4 The Mean Value Theorem", file: "4-4.html", ready: false },
        { id: "4-5", title: "4.5 Derivatives and the Shape of a Graph", file: "4-5.html", ready: false },
        { id: "4-6", title: "4.6 Limits at Infinity and Asymptotes", file: "4-6.html", ready: false },
        { id: "4-7", title: "4.7 Applied Optimization Problems", file: "4-7.html", ready: false },
        { id: "4-8", title: "4.8 L’Hôpital’s Rule", file: "4-8.html", ready: false },
        { id: "4-9", title: "4.9 Newton’s Method", file: "4-9.html", ready: false },
        { id: "4-10", title: "4.10 Antiderivatives", file: "4-10.html", ready: false },
      ]},
      { n: 5, title: "Integration", sections: [
        { id: "5-1", title: "5.1 Approximating Areas", file: "5-1.html", ready: false },
        { id: "5-2", title: "5.2 The Definite Integral", file: "5-2.html", ready: false },
        { id: "5-3", title: "5.3 The Fundamental Theorem of Calculus", file: "5-3.html", ready: false },
        { id: "5-4", title: "5.4 Integration Formulas and the Net Change Theorem", file: "5-4.html", ready: false },
        { id: "5-5", title: "5.5 Substitution", file: "5-5.html", ready: false },
        { id: "5-6", title: "5.6 Integrals Involving Exponential and Logarithmic Functions", file: "5-6.html", ready: false },
        { id: "5-7", title: "5.7 Integrals Resulting in Inverse Trigonometric Functions", file: "5-7.html", ready: false },
      ]},
      { n: 6, title: "Applications of Integration", sections: [
        { id: "6-1", title: "6.1 Areas between Curves", file: "6-1.html", ready: false },
        { id: "6-2", title: "6.2 Determining Volumes by Slicing", file: "6-2.html", ready: false },
        { id: "6-3", title: "6.3 Volumes of Revolution: Cylindrical Shells", file: "6-3.html", ready: false },
        { id: "6-4", title: "6.4 Arc Length of a Curve and Surface Area", file: "6-4.html", ready: false },
        { id: "6-5", title: "6.5 Physical Applications", file: "6-5.html", ready: false },
        { id: "6-6", title: "6.6 Moments and Centers of Mass", file: "6-6.html", ready: false },
        { id: "6-7", title: "6.7 Integrals, Exponential Functions, and Logarithms", file: "6-7.html", ready: false },
        { id: "6-8", title: "6.8 Exponential Growth and Decay", file: "6-8.html", ready: false },
        { id: "6-9", title: "6.9 Calculus of the Hyperbolic Functions", file: "6-9.html", ready: false },
      ]},
    ],
  },
  "calculus-v3": {
    title: "Calculus Volume 3",
    // Same NC-SA license as calculus-v1 — confirmed on the collection.xml and the book's
    // openstax.org page (openstax.org/details/books/calculus-volume-3).
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Calculus Volume 3", url: "https://openstax.org/books/calculus-volume-3", author: "Gilbert Strang, Edwin “Jed” Herman" },
    sectionsDir: "sections/calculus-v3",
    chapters: [
      { n: 1, title: "Parametric Equations and Polar Coordinates", sections: [
        { id: "1-1", title: "1.1 Parametric Equations", file: "1-1.html", ready: true },
        { id: "1-2", title: "1.2 Calculus of Parametric Curves", file: "1-2.html", ready: true },
        { id: "1-3", title: "1.3 Polar Coordinates", file: "1-3.html", ready: true },
        { id: "1-4", title: "1.4 Area and Arc Length in Polar Coordinates", file: "1-4.html", ready: true },
        { id: "1-5", title: "1.5 Conic Sections", file: "1-5.html", ready: true },
        { id: "1-5-review", title: "Chapter Review Exercises", file: "1-5.html#chapter-review-exercises", ready: true },
      ]},
      { n: 2, title: "Vectors in Space", sections: [
        { id: "2-1", title: "2.1 Vectors in the Plane", file: "2-1.html", ready: true },
        { id: "2-2", title: "2.2 Vectors in Three Dimensions", file: "2-2.html", ready: true },
        { id: "2-3", title: "2.3 The Dot Product", file: "2-3.html", ready: true },
        { id: "2-4", title: "2.4 The Cross Product", file: "2-4.html", ready: true },
        { id: "2-5", title: "2.5 Equations of Lines and Planes in Space", file: "2-5.html", ready: true },
        { id: "2-6", title: "2.6 Quadric Surfaces", file: "2-6.html", ready: true },
        { id: "2-7", title: "2.7 Cylindrical and Spherical Coordinates", file: "2-7.html", ready: true },
        { id: "2-7-review", title: "Chapter Review Exercises", file: "2-7.html#chapter-review-exercises", ready: true },
      ]},
      { n: 3, title: "Vector-Valued Functions", sections: [
        { id: "3-1", title: "3.1 Vector-Valued Functions and Space Curves", file: "3-1.html", ready: true },
        { id: "3-2", title: "3.2 Calculus of Vector-Valued Functions", file: "3-2.html", ready: true },
        { id: "3-3", title: "3.3 Arc Length and Curvature", file: "3-3.html", ready: true },
        { id: "3-4", title: "3.4 Motion in Space", file: "3-4.html", ready: true },
        { id: "3-4-review", title: "Chapter Review Exercises", file: "3-4.html#chapter-review-exercises", ready: true },
      ]},
      { n: 4, title: "Differentiation of Functions of Several Variables", sections: [
        { id: "4-1", title: "4.1 Functions of Several Variables", file: "4-1.html", ready: true },
        { id: "4-2", title: "4.2 Limits and Continuity", file: "4-2.html", ready: true },
        { id: "4-3", title: "4.3 Partial Derivatives", file: "4-3.html", ready: true },
        { id: "4-4", title: "4.4 Tangent Planes and Linear Approximations", file: "4-4.html", ready: true },
        { id: "4-5", title: "4.5 The Chain Rule", file: "4-5.html", ready: true },
        { id: "4-6", title: "4.6 Directional Derivatives and the Gradient", file: "4-6.html", ready: true },
        { id: "4-7", title: "4.7 Maxima/Minima Problems", file: "4-7.html", ready: true },
        { id: "4-8", title: "4.8 Lagrange Multipliers", file: "4-8.html", ready: true },
        { id: "4-8-review", title: "Chapter Review Exercises", file: "4-8.html#chapter-review-exercises", ready: true },
      ]},
      { n: 5, title: "Multiple Integration", sections: [
        { id: "5-1", title: "5.1 Double Integrals over Rectangular Regions", file: "5-1.html", ready: true },
        { id: "5-2", title: "5.2 Double Integrals over General Regions", file: "5-2.html", ready: true },
        { id: "5-3", title: "5.3 Double Integrals in Polar Coordinates", file: "5-3.html", ready: true },
        { id: "5-4", title: "5.4 Triple Integrals", file: "5-4.html", ready: true },
        { id: "5-5", title: "5.5 Triple Integrals in Cylindrical and Spherical Coordinates", file: "5-5.html", ready: true },
        { id: "5-6", title: "5.6 Calculating Centers of Mass and Moments of Inertia", file: "5-6.html", ready: true },
        { id: "5-7", title: "5.7 Change of Variables in Multiple Integrals", file: "5-7.html", ready: true },
        { id: "5-7-review", title: "Chapter Review Exercises", file: "5-7.html#chapter-review-exercises", ready: true },
      ]},
      { n: 6, title: "Vector Calculus", sections: [
        { id: "6-1", title: "6.1 Vector Fields", file: "6-1.html", ready: true },
        { id: "6-2", title: "6.2 Line Integrals", file: "6-2.html", ready: true },
        { id: "6-3", title: "6.3 Conservative Vector Fields", file: "6-3.html", ready: true },
        { id: "6-4", title: "6.4 Green’s Theorem", file: "6-4.html", ready: true },
        { id: "6-5", title: "6.5 Divergence and Curl", file: "6-5.html", ready: true },
        { id: "6-6", title: "6.6 Surface Integrals", file: "6-6.html", ready: true },
        { id: "6-7", title: "6.7 Stokes’ Theorem", file: "6-7.html", ready: true },
        { id: "6-8", title: "6.8 The Divergence Theorem", file: "6-8.html", ready: true },
        { id: "6-8-review", title: "Chapter Review Exercises", file: "6-8.html#chapter-review-exercises", ready: true },
      ]},
      { n: 7, title: "Second-Order Differential Equations", sections: [
        { id: "7-1", title: "7.1 Second-Order Linear Equations", file: "7-1.html", ready: true },
        { id: "7-2", title: "7.2 Nonhomogeneous Linear Equations", file: "7-2.html", ready: true },
        { id: "7-3", title: "7.3 Applications", file: "7-3.html", ready: true },
        { id: "7-4", title: "7.4 Series Solutions of Differential Equations", file: "7-4.html", ready: true },
        { id: "7-4-review", title: "Chapter Review Exercises", file: "7-4.html#chapter-review-exercises", ready: true },
      ]},
    ],
  },
  "intermediate-algebra-2e": {
    title: "Intermediate Algebra",
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Intermediate Algebra 2e", url: "https://openstax.org/books/intermediate-algebra-2e", author: "Lynn Marecek, Andrea Honeycutt Mathis" },
    sectionsDir: "sections/intermediate-algebra-2e",
    chapters: [
      { n: 1, title: "Foundations", sections: [
        { id: "1-1", title: "1.1 Use the Language of Algebra", file: "1-1.html", ready: true },
        { id: "1-2", title: "1.2 Integers", file: "1-2.html", ready: true },
        { id: "1-3", title: "1.3 Fractions", file: "1-3.html", ready: true },
        { id: "1-4", title: "1.4 Decimals", file: "1-4.html", ready: true },
        { id: "1-5", title: "1.5 Properties of Real Numbers", file: "1-5.html", ready: true },
        { id: "1-5-review", title: "Chapter Review Exercises", file: "1-5.html#chapter-review-exercises", ready: true },
        { id: "1-5-practice", title: "Practice Test", file: "1-5.html#practice-test", ready: true },
      ]},
      { n: 2, title: "Solving Linear Equations", sections: [
        { id: "2-1", title: "2.1 Use a General Strategy to Solve Linear Equations", file: "2-1.html", ready: true },
        { id: "2-2", title: "2.2 Use a Problem Solving Strategy", file: "2-2.html", ready: true },
        { id: "2-3", title: "2.3 Solve a Formula for a Specific Variable", file: "2-3.html", ready: true },
        { id: "2-4", title: "2.4 Solve Mixture and Uniform Motion Applications", file: "2-4.html", ready: true },
        { id: "2-5", title: "2.5 Solve Linear Inequalities", file: "2-5.html", ready: true },
        { id: "2-6", title: "2.6 Solve Compound Inequalities", file: "2-6.html", ready: true },
        { id: "2-7", title: "2.7 Solve Absolute Value Inequalities", file: "2-7.html", ready: true },
        { id: "2-7-review", title: "Chapter Review Exercises", file: "2-7.html#chapter-review-exercises", ready: true },
        { id: "2-7-practice", title: "Practice Test", file: "2-7.html#practice-test", ready: true },
      ]},
      { n: 3, title: "Graphs and Functions", sections: [
        { id: "3-1", title: "3.1 Graph Linear Equations in Two Variables", file: "3-1.html", ready: true },
        { id: "3-2", title: "3.2 Slope of a Line", file: "3-2.html", ready: true },
        { id: "3-3", title: "3.3 Find the Equation of a Line", file: "3-3.html", ready: true },
        { id: "3-4", title: "3.4 Graph Linear Inequalities in Two Variables", file: "3-4.html", ready: true },
        { id: "3-5", title: "3.5 Relations and Functions", file: "3-5.html", ready: true },
        { id: "3-6", title: "3.6 Graphs of Functions", file: "3-6.html", ready: true },
        { id: "3-6-review", title: "Chapter Review Exercises", file: "3-6.html#chapter-review-exercises", ready: true },
        { id: "3-6-practice", title: "Practice Test", file: "3-6.html#practice-test", ready: true },
      ]},
      { n: 4, title: "Systems of Linear Equations", sections: [
        { id: "4-1", title: "4.1 Solve Systems of Linear Equations with Two Variables", file: "4-1.html", ready: true },
        { id: "4-2", title: "4.2 Solve Applications with Systems of Equations", file: "4-2.html", ready: true },
        { id: "4-3", title: "4.3 Solve Mixture Applications with Systems of Equations", file: "4-3.html", ready: true },
        { id: "4-4", title: "4.4 Solve Systems of Equations with Three Variables", file: "4-4.html", ready: true },
        { id: "4-5", title: "4.5 Solve Systems of Equations Using Matrices", file: "4-5.html", ready: true },
        { id: "4-6", title: "4.6 Solve Systems of Equations Using Determinants", file: "4-6.html", ready: true },
        { id: "4-7", title: "4.7 Graphing Systems of Linear Inequalities", file: "4-7.html", ready: true },
        { id: "4-7-review", title: "Chapter Review Exercises", file: "4-7.html#chapter-review-exercises", ready: true },
        { id: "4-7-practice", title: "Chapter Practice Test", file: "4-7.html#chapter-practice-test", ready: true },
      ]},
      { n: 5, title: "Polynomials and Polynomial Functions", sections: [
        { id: "5-1", title: "5.1 Add and Subtract Polynomials", file: "5-1.html", ready: true },
        { id: "5-2", title: "5.2 Properties of Exponents and Scientific Notation", file: "5-2.html", ready: true },
        { id: "5-3", title: "5.3 Multiply Polynomials", file: "5-3.html", ready: true },
        { id: "5-4", title: "5.4 Dividing Polynomials", file: "5-4.html", ready: true },
        { id: "5-4-review", title: "Chapter Review Exercises", file: "5-4.html#chapter-review-exercises", ready: true },
        { id: "5-4-practice", title: "Chapter Practice Test", file: "5-4.html#chapter-practice-test", ready: true },
      ]},
      { n: 6, title: "Factoring", sections: [
        { id: "6-1", title: "6.1 Greatest Common Factor and Factor by Grouping", file: "6-1.html", ready: true },
        { id: "6-2", title: "6.2 Factor Trinomials", file: "6-2.html", ready: true },
        { id: "6-3", title: "6.3 Factor Special Products", file: "6-3.html", ready: true },
        { id: "6-4", title: "6.4 General Strategy for Factoring Polynomials", file: "6-4.html", ready: true },
        { id: "6-5", title: "6.5 Polynomial Equations", file: "6-5.html", ready: true },
        { id: "6-5-review", title: "Chapter Review Exercises", file: "6-5.html#chapter-review-exercises", ready: true },
        { id: "6-5-practice", title: "Chapter Practice Test", file: "6-5.html#chapter-practice-test", ready: true },
      ]},
      { n: 7, title: "Rational Expressions and Functions", sections: [
        { id: "7-1", title: "7.1 Multiply and Divide Rational Expressions", file: "7-1.html", ready: true },
        { id: "7-2", title: "7.2 Add and Subtract Rational Expressions", file: "7-2.html", ready: true },
        { id: "7-3", title: "7.3 Simplify Complex Rational Expressions", file: "7-3.html", ready: true },
        { id: "7-4", title: "7.4 Solve Rational Equations", file: "7-4.html", ready: true },
        { id: "7-5", title: "7.5 Solve Applications with Rational Equations", file: "7-5.html", ready: true },
        { id: "7-6", title: "7.6 Solve Rational Inequalities", file: "7-6.html", ready: true },
        { id: "7-6-review", title: "Chapter Review Exercises", file: "7-6.html#chapter-review-exercises", ready: true },
        { id: "7-6-practice", title: "Practice Test", file: "7-6.html#practice-test", ready: true },
      ]},
      { n: 8, title: "Roots and Radicals", sections: [
        { id: "8-1", title: "8.1 Simplify Expressions with Roots", file: "8-1.html", ready: true },
        { id: "8-2", title: "8.2 Simplify Radical Expressions", file: "8-2.html", ready: true },
        { id: "8-3", title: "8.3 Simplify Rational Exponents", file: "8-3.html", ready: true },
        { id: "8-4", title: "8.4 Add, Subtract, and Multiply Radical Expressions", file: "8-4.html", ready: true },
        { id: "8-5", title: "8.5 Divide Radical Expressions", file: "8-5.html", ready: true },
        { id: "8-6", title: "8.6 Solve Radical Equations", file: "8-6.html", ready: true },
        { id: "8-7", title: "8.7 Use Radicals in Functions", file: "8-7.html", ready: true },
        { id: "8-8", title: "8.8 Use the Complex Number System", file: "8-8.html", ready: true },
        { id: "8-8-review", title: "Chapter Review Exercises", file: "8-8.html#chapter-review-exercises", ready: true },
        { id: "8-8-practice", title: "Practice Test", file: "8-8.html#practice-test", ready: true },
      ]},
      { n: 9, title: "Quadratic Equations and Functions", sections: [
        { id: "9-1", title: "9.1 Solve Quadratic Equations Using the Square Root Property", file: "9-1.html", ready: true },
        { id: "9-2", title: "9.2 Solve Quadratic Equations by Completing the Square", file: "9-2.html", ready: true },
        { id: "9-3", title: "9.3 Solve Quadratic Equations Using the Quadratic Formula", file: "9-3.html", ready: true },
        { id: "9-4", title: "9.4 Solve Equations in Quadratic Form", file: "9-4.html", ready: true },
        { id: "9-5", title: "9.5 Solve Applications of Quadratic Equations", file: "9-5.html", ready: true },
        { id: "9-6", title: "9.6 Graph Quadratic Functions Using Properties", file: "9-6.html", ready: true },
        { id: "9-7", title: "9.7 Graph Quadratic Functions Using Transformations", file: "9-7.html", ready: true },
        { id: "9-8", title: "9.8 Solve Quadratic Inequalities", file: "9-8.html", ready: true },
        { id: "9-8-review", title: "Chapter Review Exercises", file: "9-8.html#chapter-review-exercises", ready: true },
        { id: "9-8-practice", title: "Practice Test", file: "9-8.html#practice-test", ready: true },
      ]},
    ],
  },
  "precalculus-2e": {
    title: "Precalculus",
    // NC-SA, unlike College Algebra 2e's CC BY, despite sharing the same source
    // repo — confirmed from precalculus-2e.collection.xml's own <md:license> tag.
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "OpenStax Precalculus 2e", url: "https://openstax.org/books/precalculus-2e", author: "Jay Abramson" },
    sectionsDir: "sections/precalculus-2e",
    chapters: [
      { n: 1, title: "Functions", sections: [
        { id: "1-1", title: "1.1 Functions and Function Notation", file: "1-1.html", ready: true },
        { id: "1-2", title: "1.2 Domain and Range", file: "1-2.html", ready: true },
        { id: "1-3", title: "1.3 Rates of Change and Behavior of Graphs", file: "1-3.html", ready: true },
        { id: "1-4", title: "1.4 Composition of Functions", file: "1-4.html", ready: true },
        { id: "1-5", title: "1.5 Transformation of Functions", file: "1-5.html", ready: true },
        { id: "1-6", title: "1.6 Absolute Value Functions", file: "1-6.html", ready: true },
        { id: "1-7", title: "1.7 Inverse Functions", file: "1-7.html", ready: true },
        { id: "1-7-review", title: "Chapter Review Exercises", file: "1-7.html#chapter-review-exercises", ready: true },
        { id: "1-7-practice", title: "Chapter Practice Test", file: "1-7.html#practice-test", ready: true },
      ]},
      { n: 3, title: "Polynomial and Rational Functions", sections: [
        { id: "3-1", title: "3.1 Complex Numbers", file: "3-1.html", ready: true },
        { id: "3-2", title: "3.2 Quadratic Functions", file: "3-2.html", ready: true },
        { id: "3-3", title: "3.3 Power Functions and Polynomial Functions", file: "3-3.html", ready: true },
        { id: "3-4", title: "3.4 Graphs of Polynomial Functions", file: "3-4.html", ready: true },
        { id: "3-5", title: "3.5 Dividing Polynomials", file: "3-5.html", ready: true },
        { id: "3-6", title: "3.6 Zeros of Polynomial Functions", file: "3-6.html", ready: true },
        { id: "3-7", title: "3.7 Rational Functions", file: "3-7.html", ready: true },
        { id: "3-8", title: "3.8 Inverses and Radical Functions", file: "3-8.html", ready: true },
        { id: "3-9", title: "3.9 Modeling Using Variation", file: "3-9.html", ready: true },
        { id: "3-9-review", title: "Chapter Review Exercises", file: "3-9.html#chapter-review-exercises", ready: true },
        { id: "3-9-practice", title: "Chapter Practice Test", file: "3-9.html#chapter-test", ready: true },
      ]},
      { n: 4, title: "Exponential and Logarithmic Functions", sections: [
        { id: "4-1", title: "4.1 Exponential Functions", file: "4-1.html", ready: true },
        { id: "4-2", title: "4.2 Graphs of Exponential Functions", file: "4-2.html", ready: true },
        { id: "4-3", title: "4.3 Logarithmic Functions", file: "4-3.html", ready: true },
        { id: "4-4", title: "4.4 Graphs of Logarithmic Functions", file: "4-4.html", ready: true },
        { id: "4-5", title: "4.5 Logarithmic Properties", file: "4-5.html", ready: true },
        { id: "4-6", title: "4.6 Exponential and Logarithmic Equations", file: "4-6.html", ready: true },
        { id: "4-7", title: "4.7 Exponential and Logarithmic Models", file: "4-7.html", ready: true },
        { id: "4-8", title: "4.8 Fitting Exponential Models to Data", file: "4-8.html", ready: true },
        { id: "4-8-review", title: "Chapter Review Exercises", file: "4-8.html#chapter-review-exercises", ready: true },
        { id: "4-8-practice", title: "Chapter Practice Test", file: "4-8.html#practice-test", ready: true },
      ]},
      { n: 5, title: "Trigonometric Functions", sections: [
        { id: "5-1", title: "5.1 Angles", file: "5-1.html", ready: true },
        { id: "5-2", title: "5.2 Unit Circle: Sine and Cosine Functions", file: "5-2.html", ready: true },
        { id: "5-3", title: "5.3 The Other Trigonometric Functions", file: "5-3.html", ready: true },
        { id: "5-4", title: "5.4 Right Triangle Trigonometry", file: "5-4.html", ready: true },
        { id: "5-4-review", title: "Chapter Review Exercises", file: "5-4.html#review-exercises", ready: true },
        { id: "5-4-practice", title: "Chapter Practice Test", file: "5-4.html#practice-test", ready: true },
      ]},
      { n: 6, title: "Periodic Functions", sections: [
        { id: "6-1", title: "6.1 Graphs of the Sine and Cosine Functions", file: "6-1.html", ready: true },
        { id: "6-2", title: "6.2 Graphs of the Other Trigonometric Functions", file: "6-2.html", ready: true },
        { id: "6-3", title: "6.3 Inverse Trigonometric Functions", file: "6-3.html", ready: true },
        { id: "6-3-review", title: "Chapter Review Exercises", file: "6-3.html#chapter-review-exercises", ready: true },
        { id: "6-3-practice", title: "Chapter Practice Test", file: "6-3.html#chapter-practice-test", ready: true },
      ]},
      { n: 7, title: "Trigonometric Identities and Equations", sections: [
        { id: "7-1", title: "7.1 Simplifying and Verifying Trigonometric Identities", file: "7-1.html", ready: true },
        { id: "7-2", title: "7.2 Sum and Difference Identities", file: "7-2.html", ready: true },
        { id: "7-3", title: "7.3 Double-Angle, Half-Angle, and Reduction Formulas", file: "7-3.html", ready: true },
        { id: "7-4", title: "7.4 Sum-to-Product and Product-to-Sum Formulas", file: "7-4.html", ready: true },
        { id: "7-5", title: "7.5 Solving Trigonometric Equations", file: "7-5.html", ready: true },
        { id: "7-6", title: "7.6 Modeling with Trigonometric Functions", file: "7-6.html", ready: true },
        { id: "7-6-review", title: "Chapter Review Exercises", file: "7-6.html#chapter-review-exercises", ready: true },
        { id: "7-6-practice", title: "Chapter Practice Test", file: "7-6.html#practice-test", ready: true },
      ]},
      { n: 8, title: "Further Applications of Trigonometry", sections: [
        { id: "8-1", title: "8.1 Non-right Triangles: Law of Sines", file: "8-1.html", ready: true },
        { id: "8-2", title: "8.2 Non-right Triangles: Law of Cosines", file: "8-2.html", ready: true },
        { id: "8-3", title: "8.3 Polar Coordinates", file: "8-3.html", ready: true },
        { id: "8-4", title: "8.4 Polar Coordinates: Graphs", file: "8-4.html", ready: true },
        { id: "8-5", title: "8.5 Polar Form of Complex Numbers", file: "8-5.html", ready: true },
        { id: "8-6", title: "8.6 Parametric Equations", file: "8-6.html", ready: true },
        { id: "8-7", title: "8.7 Parametric Equations: Graphs", file: "8-7.html", ready: true },
        { id: "8-8", title: "8.8 Vectors", file: "8-8.html", ready: true },
        { id: "8-8-review", title: "Chapter Review Exercises", file: "8-8.html#chapter-review-exercises", ready: true },
        { id: "8-8-practice", title: "Chapter Practice Test", file: "8-8.html#practice-test", ready: true },
      ]},
      { n: 10, title: "Analytic Geometry", sections: [
        { id: "10-1", title: "10.1 The Ellipse", file: "10-1.html", ready: true },
        { id: "10-2", title: "10.2 The Hyperbola", file: "10-2.html", ready: true },
        { id: "10-3", title: "10.3 The Parabola", file: "10-3.html", ready: true },
        { id: "10-4", title: "10.4 Rotation of Axes", file: "10-4.html", ready: true },
        { id: "10-5", title: "10.5 Conic Sections in Polar Coordinates", file: "10-5.html", ready: true },
        { id: "10-5-review", title: "Chapter Review Exercises", file: "10-5.html#chapter-review-exercises", ready: true },
        { id: "10-5-practice", title: "Chapter Practice Test", file: "10-5.html#practice-test", ready: true },
      ]},
      { n: 11, title: "Sequences, Probability and Counting Theory", sections: [
        { id: "11-1", title: "11.1 Sequences and Their Notations", file: "11-1.html", ready: true },
        { id: "11-2", title: "11.2 Arithmetic Sequences", file: "11-2.html", ready: true },
        { id: "11-3", title: "11.3 Geometric Sequences", file: "11-3.html", ready: true },
        { id: "11-4", title: "11.4 Series and Their Notations", file: "11-4.html", ready: true },
        { id: "11-5", title: "11.5 Counting Principles", file: "11-5.html", ready: true },
        { id: "11-6", title: "11.6 Binomial Theorem", file: "11-6.html", ready: true },
        { id: "11-7", title: "11.7 Probability", file: "11-7.html", ready: true },
        { id: "11-7-review", title: "Chapter Review Exercises", file: "11-7.html#chapter-review-exercises", ready: true },
        { id: "11-7-practice", title: "Chapter Practice Test", file: "11-7.html#practice-test", ready: true },
      ]},
      { n: 12, title: "Introduction to Calculus", sections: [
        { id: "12-1", title: "12.1 Finding Limits: Numerical and Graphical Approaches", file: "12-1.html", ready: true },
        { id: "12-2", title: "12.2 Finding Limits: Properties of Limits", file: "12-2.html", ready: true },
        { id: "12-3", title: "12.3 Continuity", file: "12-3.html", ready: true },
        { id: "12-4", title: "12.4 Derivatives", file: "12-4.html", ready: true },
        { id: "12-4-review", title: "Chapter Review Exercises", file: "12-4.html#chapter-review-exercises", ready: true },
        { id: "12-4-practice", title: "Chapter Practice Test", file: "12-4.html#practice-test", ready: true },
      ]},
    ],
  },
  // 1st edition specifically (Middlesex is deliberately not moving to the 2nd edition this
  // year) — source is StevenSchlicker/AC3PreTeXt (ch. 9-11, dormant since Oct 2021 — matches
  // the live activecalculus.org/multi1e/ "2022 DRAFT" colophon exactly) plus the
  // active-calculus-vector repo's "first-edition" branch (ch. 12) — NOT its main branch,
  // which switched to the 2nd edition in Aug 2026. Not OpenStax, so publisher/homepage are
  // set explicitly rather than relying on the OpenStax-only defaults.
  "active-calculus-multivariable": {
    title: "Active Calculus — Multivariable",
    license: { name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
    source: { name: "Active Calculus - Multivariable (1st ed.)", url: "https://activecalculus.org/multi1e/frontmatter.html", author: "Steven Schlicker, Mitchel T. Keller, Nicholas Long" },
    publisher: "the authors",
    homepage: { url: "https://activecalculus.org/multi1e/frontmatter.html", label: "activecalculus.org/multi1e" },
    sectionsDir: "sections/active-calculus-multivariable",
    chapters: [
      { n: 9, title: "Multivariable and Vector Functions", sections: [
        { id: "9-1", title: "9.1 Functions of Several Variables and Three Dimensional Space", file: "9-1.html", ready: true },
        { id: "9-2", title: "9.2 Vectors", file: "9-2.html", ready: true },
        { id: "9-3", title: "9.3 The Dot Product", file: "9-3.html", ready: true },
        { id: "9-4", title: "9.4 The Cross Product", file: "9-4.html", ready: true },
        { id: "9-5", title: "9.5 Lines and Planes in Space", file: "9-5.html", ready: true },
        { id: "9-6", title: "9.6 Vector-Valued Functions", file: "9-6.html", ready: true },
        { id: "9-7", title: "9.7 Derivatives and Integrals of Vector-Valued Functions", file: "9-7.html", ready: true },
        { id: "9-8", title: "9.8 Arc Length and Curvature", file: "9-8.html", ready: true },
      ]},
      { n: 10, title: "Derivatives of Multivariable Functions", sections: [
        { id: "10-1", title: "10.1 Limits", file: "10-1.html", ready: true },
        { id: "10-2", title: "10.2 First-Order Partial Derivatives", file: "10-2.html", ready: true },
        { id: "10-3", title: "10.3 Second-Order Partial Derivatives", file: "10-3.html", ready: true },
        { id: "10-4", title: "10.4 Linearization: Tangent Planes and Differentials", file: "10-4.html", ready: true },
        { id: "10-5", title: "10.5 The Chain Rule", file: "10-5.html", ready: true },
        { id: "10-6", title: "10.6 Directional Derivatives and the Gradient", file: "10-6.html", ready: true },
        { id: "10-7", title: "10.7 Optimization", file: "10-7.html", ready: true },
        { id: "10-8", title: "10.8 Constrained Optimization: Lagrange Multipliers", file: "10-8.html", ready: true },
      ]},
      { n: 11, title: "Multiple Integrals", sections: [
        { id: "11-1", title: "11.1 Double Riemann Sums and Double Integrals over Rectangles", file: "11-1.html", ready: true },
        { id: "11-2", title: "11.2 Iterated Integrals", file: "11-2.html", ready: true },
        { id: "11-3", title: "11.3 Double Integrals over General Regions", file: "11-3.html", ready: true },
        { id: "11-4", title: "11.4 Applications of Double Integrals", file: "11-4.html", ready: true },
        { id: "11-5", title: "11.5 Double Integrals in Polar Coordinates", file: "11-5.html", ready: true },
        { id: "11-6", title: "11.6 Surfaces Defined Parametrically and Surface Area", file: "11-6.html", ready: true },
        { id: "11-7", title: "11.7 Triple Integrals", file: "11-7.html", ready: true },
        { id: "11-8", title: "11.8 Triple Integrals in Cylindrical and Spherical Coordinates", file: "11-8.html", ready: true },
        { id: "11-9", title: "11.9 Change of Variables", file: "11-9.html", ready: true },
      ]},
      { n: 12, title: "Vector Calculus", sections: [
        { id: "12-1", title: "12.1 Vector Fields", file: "12-1.html", ready: true },
        { id: "12-2", title: "12.2 The Idea of a Line Integral", file: "12-2.html", ready: true },
        { id: "12-3", title: "12.3 Using Parametrizations to Calculate Line Integrals", file: "12-3.html", ready: true },
        { id: "12-4", title: "12.4 Path-Independent Vector Fields and the Fundamental Theorem of Calculus for Line Integrals", file: "12-4.html", ready: true },
        { id: "12-5", title: "12.5 Line Integrals of Scalar Functions", file: "12-5.html", ready: true },
        { id: "12-6", title: "12.6 The Divergence of a Vector Field", file: "12-6.html", ready: true },
        { id: "12-7", title: "12.7 The Curl of a Vector Field", file: "12-7.html", ready: true },
        { id: "12-8", title: "12.8 Green's Theorem", file: "12-8.html", ready: true },
        { id: "12-9", title: "12.9 Flux Integrals", file: "12-9.html", ready: true },
        { id: "12-10", title: "12.10 Surface Integrals of Scalar Valued Functions", file: "12-10.html", ready: true },
        { id: "12-11", title: "12.11 Stokes' Theorem", file: "12-11.html", ready: true },
        { id: "12-12", title: "12.12 The Divergence Theorem", file: "12-12.html", ready: true },
      ]},
    ],
  },
};
const DEFAULT_BOOK = "college-algebra-2e";

/* ---------- theme ---------- */
const themeKey = "mxalg-theme";
function applyTheme(t) { document.documentElement.dataset.theme = t; }
applyTheme(localStorage.getItem(themeKey) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
function toggleTheme() {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeKey, t); applyTheme(t);
}

/* ---------- per-page setup ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const isSection = location.pathname.includes("/sections/");
  // Derive the path back to the site root from this page's own <script src="…assets/app.js">
  // tag rather than assuming a fixed nesting depth: section files sit two levels down
  // (sections/<book-id>/6-1.html, root "../..") while books/<id>/index.html is one level
  // down. Reading it off the script tag works at any depth automatically.
  const appScript = document.querySelector('script[src$="assets/app.js"]');
  const scriptSrc = appScript ? appScript.getAttribute("src") : "assets/app.js";
  const root = scriptSrc.replace(/assets\/app\.js$/, "").replace(/\/$/, "") || ".";

  // which book this page belongs to: <body data-book="..."> wins; unset/unknown
  // falls back to college-algebra-2e so pre-multi-book pages never break.
  const bookId = (document.body.dataset.book && BOOKS[document.body.dataset.book]) ? document.body.dataset.book : DEFAULT_BOOK;
  const BOOK = BOOKS[bookId];

  // A live playlist (see initPlaylist below) should survive ordinary book/sidebar
  // navigation — a student browsing off-sequence and back shouldn't lose their teacher's
  // playlist — so every same-origin nav link this handler generates gets `pl` reattached.
  // Only the playlist bar's own "Exit playlist" button (or manually editing the URL)
  // actually drops it. In-page anchors (outline links, "#example1", …) need no help: a
  // bare "#foo" href already resolves against the current URL, keeping the query as-is.
  const plRaw = new URLSearchParams(location.search).get("pl");

  /* sidebar: collapsible book contents + auto-generated page outline */
  const sb = document.querySelector(".sidebar");
  if (sb) {
    // every book's section files live in a book-scoped subfolder sections/<book-id>/ —
    // sectionsDir already encodes the path, relative to site root.
    let book = "";
    for (const ch of BOOK.chapters) {
      book += `<h4>Chapter ${ch.n} · ${ch.title}</h4>`;
      for (const s of ch.sections) {
        if (s.ready) {
          // s.file is usually just "6-1.html", but a chapter's bundled Chapter Review
          // Exercises/Practice Test (CLAUDE.md: OpenStax packs these into the last
          // section's own page) get their own sidebar rows pointing at an in-page anchor,
          // e.g. "3-7.html#chapter-review-exercises" — split off the hash before comparing
          // against location.pathname (which never contains one) and separately require
          // location.hash to match so only one of the same-page siblings lights up instead
          // of all of them whenever you're anywhere on that file.
          const [sPath, sHash] = s.file.split("#");
          const pathMatches = location.pathname.endsWith("/" + BOOK.sectionsDir + "/" + sPath);
          const hashMatches = sHash ? location.hash === "#" + sHash : !location.hash;
          const active = (pathMatches && hashMatches) ? " class=\"active\"" : "";
          book += `<a href="${withPlaylist(`${root}/${BOOK.sectionsDir}/${s.file}`, plRaw)}"${active}>${s.title}</a>`;
        } else {
          book += `<a class="soon">${s.title}</a>`;
        }
      }
    }
    // "All books" sits outside the collapsible <details> (as opposed to inside it,
    // right after the summary, which used to hide it whenever the fold was closed)
    // so it's always visible regardless of the Book contents fold state, and reads
    // above "Book contents" as the sidebar's top-level escape hatch.
    sb.innerHTML =
      `<a class="allbooks" href="${withPlaylist(`${root}/index.html`, plRaw)}">← All books</a>` +
      `<details class="booknav"${isSection ? "" : " open"}><summary>Book contents</summary>${book}</details>` +
      `<div class="outline"></div>`;
    if (isSection) buildOutline(sb.querySelector(".outline"));

    /* whole-sidebar show/hide toggle, persisted, independent of practice panel */
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      const btn = document.createElement("button");
      btn.className = "iconbtn navbtn";
      btn.title = "Show or hide the contents sidebar";
      btn.setAttribute("aria-label", "Show or hide the contents sidebar");
      btn.textContent = "☰";
      topbar.insertBefore(btn, topbar.firstChild);
      const key = "mxalg-nav";
      const apply = on => { document.body.classList.toggle("nosidebar", !on); btn.classList.toggle("on", on); };
      let on = localStorage.getItem(key) !== "0";
      apply(on);
      btn.addEventListener("click", () => { on = !on; localStorage.setItem(key, on ? "1" : "0"); apply(on); });
    }
  }

  // brand link is hand-authored per page (not generated here like the sidebar), so it
  // needs its own rewrite to keep carrying `pl` forward.
  if (plRaw) {
    const brand = document.querySelector(".topbar .brand");
    if (brand) brand.setAttribute("href", withPlaylist(brand.getAttribute("href"), plRaw));
  }

  // site-wide search — independent of the sidebar so it also appears on the top-level
  // book-picker page (index.html), which has a topbar but no .sidebar nav.
  const topbarEl = document.querySelector(".topbar");
  if (topbarEl) initSearch(root, topbarEl);

  // shareable playlists: no-op unless the page carries a ?pl= param (any section page)
  // or is the builder page itself (playlist.html).
  initPlaylist(root);
  initPlaylistBuilder(root);

  // theme button
  document.querySelectorAll("[data-theme-toggle]").forEach(b => b.addEventListener("click", toggleTheme));

  // split practice panel
  const splitApi = setupSplit();

  // Focus Tools (playlist + in-page assignment builder) and reading an ?assign= link —
  // both need splitApi to force the practice panel open, so they're wired after it.
  initFocusTools(root, splitApi);
  initAssignment(splitApi);

  // reading progress
  const bar = document.getElementById("progressbar");
  if (bar) {
    const upd = () => {
      const h = document.documentElement;
      bar.style.width = (100 * h.scrollTop / (h.scrollHeight - h.clientHeight)) + "%";
    };
    addEventListener("scroll", upd, { passive: true }); upd();
  }

  // collapsible solutions
  document.querySelectorAll(".solution .sol-toggle").forEach(btn => {
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const sol = btn.closest(".solution");
      const open = sol.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      // toggles just the Show/Hide prefix so it works for both "Show solution" and
      // "Show answer" wording without hardcoding which noun this particular button uses
      btn.textContent = btn.textContent.replace(open ? "Show" : "Hide", open ? "Hide" : "Show");
      const tryit = btn.closest(".tryit");
      if (tryit && open) tryit.classList.add("answered");
    });
  });

  // exercise/activity-task answer buttons (chapter 12's <task><answer> reveals reuse this
  // same show/hide pattern, so the selector isn't scoped to .exercise alone)
  document.querySelectorAll(".answer > button").forEach(btn => {
    btn.addEventListener("click", () => {
      const a = btn.parentElement;
      a.classList.toggle("open");
      btn.textContent = a.classList.contains("open") ? "Hide answer" : "Show answer";
    });
  });

  // try-it self check, persisted
  // Namespaced by full path (not just filename) so identically-named section files in
  // different books — e.g. 6-1.html in both college-algebra-2e and calculus-v1 — don't
  // share saved Try It progress.
  const pageKey = "mxalg-" + bookId + "-" + location.pathname.split("/").slice(-2).join("/");
  const saved = JSON.parse(localStorage.getItem(pageKey) || "{}");
  document.querySelectorAll(".tryit").forEach(t => {
    const id = t.id; if (!id) return;
    const mark = saved[id];
    if (mark) { t.classList.add("answered"); }
    t.querySelectorAll(".selfcheck button").forEach(b => {
      b.setAttribute("aria-pressed", String(mark === b.dataset.mark));
      if (mark === b.dataset.mark) b.classList.add(b.dataset.mark === "right" ? "on-right" : "on-wrong");
      b.addEventListener("click", () => {
        saved[id] = b.dataset.mark;
        localStorage.setItem(pageKey, JSON.stringify(saved));
        t.querySelectorAll(".selfcheck button").forEach(x => {
          x.classList.remove("on-right", "on-wrong");
          x.setAttribute("aria-pressed", "false");
        });
        b.classList.add(b.dataset.mark === "right" ? "on-right" : "on-wrong");
        b.setAttribute("aria-pressed", "true");
        updateScore();
      });
    });
  });
  function updateScore() {
    const el = document.getElementById("tryit-score"); if (!el) return;
    const total = document.querySelectorAll(".tryit").length;
    const right = Object.values(JSON.parse(localStorage.getItem(pageKey) || "{}")).filter(v => v === "right").length;
    el.textContent = `Try Its: ${right}/${total} ✓`;
  }
  updateScore();

  // attribution footer: always regenerated from BOOK.license/source rather than trusted
  // as static markup, so a book's footer can never drift to the wrong license (e.g.
  // Calculus's CC BY-NC-SA showing as plain CC BY) even if a hand-edited page's footer
  // text goes stale. Section pages built by tools/build-section.mjs emit a matching
  // footer already, but this is the single source of truth.
  // Only regenerate the footer on pages that actually declare a book (data-book) — the
  // top-level book-picker hub has no single book to attribute and keeps its own neutral
  // footer text untouched.
  const footer = document.body.dataset.book ? document.querySelector("footer.attribution") : null;
  if (footer) {
    // publisher/homepage default to OpenStax for backward compat — every book before
    // Active Calculus was OpenStax and never set these fields explicitly.
    const publisher = BOOK.publisher || "OpenStax";
    const home = BOOK.homepage || { url: "https://openstax.org", label: "openstax.org" };
    footer.innerHTML =
      `Content from <a href="${BOOK.source.url}">${BOOK.source.name}</a> by ${BOOK.source.author}, © ${publisher}, licensed under ` +
      `<a href="${BOOK.license.url}">${BOOK.license.name}</a>. ` +
      `This site is not affiliated with ${publisher} and is not endorsed by them. Access the original free at <a href="${home.url}">${home.label}</a>.`;
  }

  // math
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
      // Active Calculus - Multivariable's own LaTeX preamble (docinfo/macros in merge.mbx)
      // defines these bold-vector shorthands -- without them KaTeX has no idea what \vu/\vv/
      // etc. mean and just prints the raw macro name as literal text. Harmless to declare
      // globally: none of these short names collide with anything in the OpenStax books.
      macros: {
        "\\R": "\\mathbb{R}",
        "\\va": "\\mathbf{a}", "\\vb": "\\mathbf{b}", "\\vc": "\\mathbf{c}", "\\vC": "\\mathbf{C}",
        "\\vd": "\\mathbf{d}", "\\ve": "\\mathbf{e}", "\\vi": "\\mathbf{i}", "\\vj": "\\mathbf{j}",
        "\\vk": "\\mathbf{k}", "\\vn": "\\mathbf{n}", "\\vm": "\\mathbf{m}", "\\vr": "\\mathbf{r}",
        "\\vs": "\\mathbf{s}", "\\vu": "\\mathbf{u}", "\\vv": "\\mathbf{v}", "\\vw": "\\mathbf{w}",
        "\\vx": "\\mathbf{x}", "\\vy": "\\mathbf{y}", "\\vz": "\\mathbf{z}", "\\vzero": "\\mathbf{0}",
        "\\vF": "\\mathbf{F}", "\\vR": "\\mathbf{R}", "\\vT": "\\mathbf{T}", "\\vN": "\\mathbf{N}",
        "\\vL": "\\mathbf{L}", "\\vB": "\\mathbf{B}",
        "\\proj": "\\text{proj}", "\\comp": "\\text{comp}",
        // Chapter 12 (vector calculus, active-calculus-vector repo)'s own docinfo-core.ptx adds
        // a few more of these bold-vector shorthands plus a magnitude/gradient notation, none
        // of which chapters 9-11's own preamble (above) ever needed.
        "\\vG": "\\mathbf{G}", "\\vH": "\\mathbf{H}", "\\vS": "\\mathbf{S}",
        "\\vecmag": "|#1|", "\\grad": "\\nabla", "\\nin": "",
        // \DeclareMathOperator (not \newcommand, but same idea) in the same docinfo-core.ptx --
        // upright-roman operator names, not bold vectors. \divg missing entirely produced a
        // literal "\divg" in the rendered text everywhere it appeared (found: all of 12.6,
        // which is built entirely around this notation). \curl is the same declaration, ahead
        // of 12.7 needing it.
        "\\divg": "\\operatorname{div}", "\\curl": "\\operatorname{curl}",
      },
    });
  }

  // plots
  document.querySelectorAll("[data-plot]").forEach(drawPlot);
  document.querySelectorAll("[data-desmos]").forEach(drawDesmos);

  // Sage Cell interactives (Chapter 12 vector calculus) -- window.sagecell is loaded via a
  // per-page <script src="https://sagecell.sagemath.org/static/embedded_sagecell.js"> that
  // build-acm-section.mjs only adds to pages that actually contain a live interactive, same
  // conditional-CDN-script convention as drawDesmos() above. makeSagecell() scans the DOM once
  // for ".sage-embed" wrappers and turns their embedded <script type="text/x-sage"> code into a
  // Sage-computed figure. autoeval runs it immediately on page load (matching the published
  // book's own behavior, where these read as plain figures, not something a student has to
  // trigger), so the eval button itself is hidden too -- nothing left to click. Evaluation
  // still happens on Sage's shared public server, not locally. The wrapper class deliberately
  // isn't "sagecell" itself -- that collides with the library's own internal namespace and
  // silently matches nothing.
  if (window.sagecell && document.querySelector(".sage-embed")) {
    window.sagecell.makeSagecell({
      inputLocation: ".sage-embed",
      autoeval: true,
      hide: ["editor", "permalink", "files", "fullScreen", "language", "evalButton"],
    });
  }
});

/* ---------- site-wide search ----------
   Searches topic headings, Key Concepts bullets ("learning objectives"), and glossary
   terms across every book at once, from a static JSON index (assets/search-index.json,
   built by tools/build-search-index.mjs — re-run that script after any hand-pass edit
   that changes headings/Key-Concepts/glossary content). Deliberately keyword/substring
   matching, not semantic search — no server, fits this site's no-build-step constraint,
   and is enough to jump from e.g. a Calculus page to the Precalc section that first
   covers "vertical asymptote". */
function initSearch(root, topbar) {
  const box = document.createElement("div");
  box.className = "searchbox";
  box.innerHTML =
    `<input type="search" class="search-input" placeholder="Search topics, skills, or objectives…" aria-label="Search all books" autocomplete="off" ` +
    `role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-controls="search-listbox" aria-autocomplete="list">` +
    `<div class="search-results" id="search-listbox" role="listbox" hidden></div>` +
    `<div class="sr-only" aria-live="polite"></div>`;
  const spacer = topbar.querySelector(".spacer");
  if (spacer) spacer.after(box); else topbar.appendChild(box);

  const input = box.querySelector(".search-input");
  const resultsEl = box.querySelector(".search-results");
  const liveEl = box.querySelector(".sr-only");
  let indexPromise = null, activeIdx = -1, indexError = false;

  // Keeps aria-expanded in sync with visibility everywhere resultsEl.hidden is toggled —
  // screen readers use this to announce whether the listbox is currently open.
  const setOpen = open => { resultsEl.hidden = !open; input.setAttribute("aria-expanded", String(open)); };

  // fetch() of a local assets/search-index.json fails under file:// (browsers block it as
  // cross-origin, "null" origin) — surface that as a visible message rather than silently
  // returning zero hits for every query, which looks indistinguishable from a broken index.
  const loadIndex = () => indexPromise || (indexPromise =
    fetch(`${root}/assets/search-index.json`)
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(err => { indexError = true; console.warn("Search index failed to load:", err); return []; }));

  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const highlight = (text, q) => {
    const i = text.toLowerCase().indexOf(q);
    if (i === -1) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  };

  // Renders chapters (one per matching book chapter), each with 1+ matching sections as
  // sub-hits. A chapter with a single matching section collapses to one link (book · section
  // eyebrow + the matching text); a chapter with several matching sections renders a linked
  // chapter header plus a nested list of section sub-hits — so e.g. a query that hits
  // Precalc 3.3, 3.4, and 3.6 (all in "Chapter 3 · Polynomial and Rational Functions") shows
  // as one chapter with three section lines, not three separate top-level results crowding
  // out other books' chapters. Sub-hit navigation stops at the section: clicking jumps to
  // that section's best-matching anchor, and the reader takes it from there via the page's
  // own outline rather than the search box drilling into individual headings/examples.
  function render(chapters, q) {
    activeIdx = -1;
    if (!chapters.length) {
      resultsEl.innerHTML = `<div class="search-empty">No matches for “${esc(q)}”.</div>`;
      setOpen(true);
      liveEl.textContent = `No results for ${q}.`;
      return;
    }
    // Every .search-hit gets role="option" and a unique id here so aria-activedescendant
    // (set in updateActive below) can point a screen reader at whichever one is highlighted
    // — without this, arrow-key navigation moves the visual highlight but leaves the
    // input's accessible content unchanged, so a screen reader just re-reads the typed query.
    let n = 0;
    resultsEl.innerHTML = chapters.map(hits => {
      const top = hits[0];
      const topHref = `${root}/${top.path}#${top.anchor}`;
      if (hits.length === 1) {
        const eyebrow = `<div class="search-eyebrow">${esc(top.bookTitle)} · ${esc(top.sectionTitle)}</div>`;
        const detail = top.detail ? `<div class="search-detail">${esc(top.detail)}</div>` : "";
        return `<a class="search-hit" role="option" id="search-opt-${n++}" href="${topHref}">${eyebrow}` +
          `<div class="search-main">${highlight(top.text, q)}</div>${detail}</a>`;
      }
      const head = `<div class="search-eyebrow">${esc(top.bookTitle)}</div>` +
        `<div class="search-main">Chapter ${esc(String(top.chapterN))} · ${esc(top.chapterTitle)}</div>`;
      const headId = `search-opt-${n++}`;
      const subs = hits.map(e => {
        const href = `${root}/${e.path}#${e.anchor}`;
        const detail = e.detail ? `<div class="search-detail">${esc(e.detail)}</div>` : "";
        return `<a class="search-hit search-subhit" role="option" id="search-opt-${n++}" href="${href}">` +
          `<div class="search-eyebrow">${esc(e.sectionTitle)}</div>` +
          `<div class="search-main">${highlight(e.text, q)}</div>${detail}</a>`;
      }).join("");
      return `<div class="search-section">` +
        `<a class="search-hit search-section-head" role="option" id="${headId}" href="${topHref}">${head}</a>` +
        `<div class="search-subhits">${subs}</div></div>`;
    }).join("");
    setOpen(true);
    liveEl.textContent = `${n} result${n === 1 ? "" : "s"} for ${q}.`;
  }

  let debounceT;
  input.addEventListener("input", () => {
    clearTimeout(debounceT);
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { setOpen(false); resultsEl.innerHTML = ""; return; }
    debounceT = setTimeout(async () => {
      const data = await loadIndex();
      if (indexError) {
        resultsEl.innerHTML = `<div class="search-empty">Search index couldn't load. If you opened this page directly from a file (a file:// address), browsers block that fetch — run a local server (e.g. <code>npx serve .</code>) instead, or use the hosted site.</div>`;
        setOpen(true);
        return;
      }
      const scored = [];
      for (const e of data) {
        const t = e.text.toLowerCase();
        let idx = t.indexOf(q), inDetail = false;
        if (idx === -1 && e.detail) { idx = e.detail.toLowerCase().indexOf(q); inDetail = true; }
        if (idx === -1) continue;
        const typeWeight = e.type === "heading" ? 3 : e.type === "glossary" ? 2.5 : 2;
        const score = typeWeight * 100 - idx * 0.5 - t.length * 0.02 - (inDetail ? 50 : 0);
        scored.push({ e, score });
      }
      // Step 1: collapse to one (best-scoring) hit per section — a query routinely matches
      // several headings/objectives within the same section (e.g. Int Alg 8.5's "...one-term
      // denominator" and "...two-term denominator" headings both matching "rational"), and
      // showing each separately just repeats the same section without adding information.
      const bySection = new Map();
      for (const s of scored) {
        const prev = bySection.get(s.e.path);
        if (!prev || s.score > prev.score) bySection.set(s.e.path, s);
      }
      // Step 2: group those section-level hits by chapter (book + chapter number) so a query
      // that hits several sections in one chapter (e.g. Precalc 3.3/3.4/3.6, all in "Chapter
      // 3 · Polynomial and Rational Functions") shows as one chapter with those sections
      // nested underneath, rather than several flat results that used to crowd the top-N
      // slice and starve other books'/chapters' matches entirely.
      const byChapter = new Map();
      for (const s of bySection.values()) {
        const key = `${s.e.book}::${s.e.chapterN}`;
        let group = byChapter.get(key);
        if (!group) { group = { score: s.score, hits: [] }; byChapter.set(key, group); }
        group.hits.push(s);
        if (s.score > group.score) group.score = s.score;
      }
      // Within a chapter, pick the 6 most relevant sections by score, but then display them
      // in section order (3.3, 3.4, 3.5, …) rather than by score — reads like a table of
      // contents instead of a shuffled relevance list.
      const sectionNum = title => { const m = /^\d+\.(\d+)/.exec(title); return m ? +m[1] : 0; };
      const chapters = [...byChapter.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(g => g.hits.sort((a, b) => b.score - a.score).slice(0, 6)
          .sort((a, b) => sectionNum(a.e.sectionTitle) - sectionNum(b.e.sectionTitle))
          .map(s => s.e));
      render(chapters, q);
    }, 120);
  });

  const updateActive = items => {
    items.forEach((el, i) => {
      const on = i === activeIdx;
      el.classList.toggle("active", on);
      el.setAttribute("aria-selected", String(on));
    });
    if (items[activeIdx]) {
      items[activeIdx].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", items[activeIdx].id);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  };
  input.addEventListener("keydown", ev => {
    const items = resultsEl.querySelectorAll(".search-hit");
    if (ev.key === "Escape") { setOpen(false); input.blur(); }
    else if (ev.key === "ArrowDown" && items.length) { ev.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); updateActive(items); }
    else if (ev.key === "ArrowUp" && items.length) { ev.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); updateActive(items); }
    else if (ev.key === "Enter") { const target = items[activeIdx] || items[0]; if (target) { ev.preventDefault(); target.click(); } }
  });
  input.addEventListener("focus", () => { if (resultsEl.innerHTML) setOpen(true); });
  document.addEventListener("click", ev => { if (!box.contains(ev.target)) setOpen(false); });
}

/* ---------- shareable playlists ----------
   A teacher builds an ordered sequence of sections (any book, any order) on playlist.html
   and shares one link — the whole playlist lives in a `?pl=` query param, e.g.
   "?pl=college-algebra-2e:6-1,calculus-v1:2-1" — no backend, no accounts, matching this
   site's static/no-build-step constraint. Any section page that loads with a `pl` param
   present renders a small prev/next bar (initPlaylist); playlist.html itself renders the
   builder UI (initPlaylistBuilder). Both share the entry-resolving/URL-building helpers
   below so the two can't drift out of sync on the encoding format. */
function resolvePlaylistEntry(bookId, sectionId) {
  const book = BOOKS[bookId];
  if (!book) return null;
  for (const ch of book.chapters) {
    const s = ch.sections.find(x => x.id === sectionId && x.ready);
    if (s) return { bookId, bookTitle: book.title, sectionsDir: book.sectionsDir, id: sectionId, title: s.title, file: s.file };
  }
  return null;
}
// file may carry a "#anchor" (chapter-review/practice-test sections share their parent
// section's file) — the query string has to land before the hash, not after it.
function playlistUrlFor(root, entry, raw) {
  const [filePath, hash] = entry.file.split("#");
  return `${root}/${entry.sectionsDir}/${filePath}?pl=${raw}${hash ? "#" + hash : ""}`;
}
// Reattaches an active playlist to a plain (non-playlist-aware) href generated elsewhere
// on the page — the sidebar's section links, "All books", the brand link — so browsing
// off-sequence and back doesn't silently lose the teacher's playlist. No-ops if no
// playlist is active. Same "query before hash" ordering as playlistUrlFor above.
function withPlaylist(href, plRaw) {
  if (!plRaw) return href;
  const [path, hash] = href.split("#");
  return `${path}?pl=${plRaw}${hash ? "#" + hash : ""}`;
}

function initPlaylist(root) {
  const raw = new URLSearchParams(location.search).get("pl");
  if (!raw) return;
  const entries = raw.split(",").map(pair => {
    const [bookId, sectionId] = pair.split(":");
    return resolvePlaylistEntry(bookId, sectionId);
  }).filter(Boolean);
  if (!entries.length) return;

  // same path+hash matching convention the sidebar uses for chapter-review/practice-test
  // anchors sharing a file with their parent section.
  const idx = entries.findIndex(e => {
    const [filePath, hash] = e.file.split("#");
    const pathMatches = location.pathname.endsWith("/" + e.sectionsDir + "/" + filePath);
    const hashMatches = hash ? location.hash === "#" + hash : !location.hash;
    return pathMatches && hashMatches;
  });

  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const here = idx === -1 ? null : entries[idx];
  const status = here
    ? `${idx + 1} of ${entries.length} &middot; <strong>${here.bookTitle}: ${here.title}</strong>`
    : `${entries.length} sections in this playlist`;
  const bar = document.createElement("div");
  bar.className = "playlistbar";
  bar.innerHTML =
    `<span class="pl-chip">&#9654; Playlist</span>` +
    `<button class="iconbtn pl-prev" ${idx <= 0 ? "disabled" : ""}>&larr; Prev</button>` +
    `<span class="pl-status">${status}</span>` +
    `<button class="iconbtn pl-next" ${(idx === -1 || idx >= entries.length - 1) ? "disabled" : ""}>Next &rarr;</button>` +
    `<span class="spacer"></span>` +
    `<div class="pl-listbox"><button class="iconbtn pl-toggle">&#9776; List</button><div class="pl-list" hidden></div></div>` +
    `<button class="iconbtn pl-exit" title="Exit playlist" aria-label="Exit playlist">&times;</button>`;
  topbar.insertAdjacentElement("afterend", bar);

  const goto = i => { if (entries[i]) location.href = playlistUrlFor(root, entries[i], raw); };
  bar.querySelector(".pl-prev").addEventListener("click", () => goto(idx - 1));
  bar.querySelector(".pl-next").addEventListener("click", () => goto(idx + 1));
  bar.querySelector(".pl-exit").addEventListener("click", () => { location.href = location.pathname + location.hash; });

  const listEl = bar.querySelector(".pl-list");
  listEl.innerHTML = entries.map((e, i) =>
    `<a class="pl-item${i === idx ? " active" : ""}" href="${playlistUrlFor(root, e, raw)}">${i + 1}. ${e.bookTitle}: ${e.title}</a>`
  ).join("");
  bar.querySelector(".pl-toggle").addEventListener("click", () => { listEl.hidden = !listEl.hidden; });
  document.addEventListener("click", ev => { if (!bar.contains(ev.target)) listEl.hidden = true; });
}

function initPlaylistBuilder(root) {
  const picker = document.querySelector("[data-playlist-picker]");
  if (!picker) return;
  const queueList = document.querySelector("[data-playlist-queue]");
  const emptyMsg = document.querySelector("[data-playlist-empty]");
  const urlInput = document.querySelector("[data-playlist-url]");
  const copyBtn = document.querySelector("[data-playlist-copy]");

  let queue = []; // ordered [{bookId, id}], order = the order a teacher checked things

  // Course-catalog order (roughly Middlesex's own sequence), not BOOKS' declaration
  // order — falls back to declaration order for any future book not listed here.
  const BOOK_ORDER = ["intermediate-algebra-2e", "college-algebra-2e", "precalculus-2e", "calculus-v1", "calculus-v3", "active-calculus-multivariable"];
  const bookIds = [...BOOK_ORDER, ...Object.keys(BOOKS).filter(id => !BOOK_ORDER.includes(id))];

  let html = "";
  for (const bookId of bookIds) {
    const book = BOOKS[bookId];
    if (!book) continue;
    const readyChapters = book.chapters
      .map(ch => ({ n: ch.n, title: ch.title, sections: ch.sections.filter(s => s.ready) }))
      .filter(ch => ch.sections.length);
    if (!readyChapters.length) continue;
    html += `<details class="plbook"><summary>${book.title}</summary>`;
    for (const ch of readyChapters) {
      html += `<h4>Chapter ${ch.n} &middot; ${ch.title}</h4>`;
      for (const s of ch.sections) {
        html += `<label class="plsec"><input type="checkbox" data-book="${bookId}" data-id="${s.id}"> ${s.title}</label>`;
      }
    }
    html += `</details>`;
  }
  picker.innerHTML = html;

  function render() {
    if (!queue.length) {
      queueList.innerHTML = "";
      emptyMsg.hidden = false;
      urlInput.value = "";
      return;
    }
    emptyMsg.hidden = true;
    queueList.innerHTML = queue.map((q, i) => {
      const e = resolvePlaylistEntry(q.bookId, q.id);
      return `<li>` +
        `<span class="plqueue-n">${i + 1}.</span>` +
        `<span class="plqueue-t">${e.bookTitle}: ${e.title}</span>` +
        `<button class="iconbtn plq-up" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Move up" aria-label="Move item ${i + 1} up">&uarr;</button>` +
        `<button class="iconbtn plq-down" data-i="${i}" ${i === queue.length - 1 ? "disabled" : ""} title="Move down" aria-label="Move item ${i + 1} down">&darr;</button>` +
        `<button class="iconbtn plq-remove" data-i="${i}" title="Remove" aria-label="Remove item ${i + 1}">&times;</button>` +
        `</li>`;
    }).join("");
    const raw = queue.map(q => `${q.bookId}:${q.id}`).join(",");
    const first = resolvePlaylistEntry(queue[0].bookId, queue[0].id);
    urlInput.value = new URL(playlistUrlFor(root, first, raw), location.href).href;
  }

  picker.addEventListener("change", ev => {
    const cb = ev.target;
    if (cb.tagName !== "INPUT") return;
    const bookId = cb.dataset.book, id = cb.dataset.id;
    if (cb.checked) queue.push({ bookId, id });
    else queue = queue.filter(q => !(q.bookId === bookId && q.id === id));
    render();
  });

  queueList.addEventListener("click", ev => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const i = Number(btn.dataset.i);
    if (btn.classList.contains("plq-up") && i > 0) {
      [queue[i - 1], queue[i]] = [queue[i], queue[i - 1]];
    } else if (btn.classList.contains("plq-down") && i < queue.length - 1) {
      [queue[i + 1], queue[i]] = [queue[i], queue[i + 1]];
    } else if (btn.classList.contains("plq-remove")) {
      const removed = queue[i];
      queue.splice(i, 1);
      const cb = picker.querySelector(`input[data-book="${removed.bookId}"][data-id="${removed.id}"]`);
      if (cb) cb.checked = false;
    }
    render();
  });

  copyBtn.addEventListener("click", () => {
    if (!urlInput.value) return;
    navigator.clipboard.writeText(urlInput.value).then(() => {
      const orig = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    }).catch(() => { urlInput.select(); });
  });

  render();
}

/* ---------- Focus Tools: playlist + in-page assignment builder ----------
   One persistent header button (same slot/pattern as the theme toggle) that opens a
   two-item menu: "Build a playlist" (links out to playlist.html, unchanged) and "Build
   tonight's assignment" (section pages only) — deliberately tucked behind a single entry
   point rather than adding always-visible teacher-facing controls to the reading page
   every student sees. Assignments are single-section, unlike playlists: pick exercises
   on the section a teacher is already looking at, copy a link, done — no ordering, no
   cross-book resolution needed, since the reader is already on the right page. */
function initFocusTools(root, splitApi) {
  const themeBtn = document.querySelector("[data-theme-toggle]");
  if (!themeBtn) return;
  const exercisePanel = document.getElementById("exercise-panel-content");
  // A page already opened via a ?assign= link has something to edit, in addition to
  // (not instead of) starting a fresh one — a teacher might want to tweak the assignment
  // they're currently looking at, or just build a new one from this same section.
  const hasAssignment = new URLSearchParams(location.search).has("assign");

  const box = document.createElement("div");
  box.className = "focusbox";
  box.innerHTML =
    `<button class="iconbtn" data-focus-toggle title="Playlist and assignment tools">🎯 Focus Tools</button>` +
    `<div class="focus-menu" hidden>` +
      `<a class="focus-item" href="${root}/playlist.html">📑 Build a playlist</a>` +
      (exercisePanel ? `<button class="focus-item" data-focus-assign>📝 Build tonight's assignment</button>` : "") +
      (exercisePanel && hasAssignment ? `<button class="focus-item" data-focus-edit-assign>✏️ Edit this assignment</button>` : "") +
    `</div>`;
  themeBtn.parentElement.insertBefore(box, themeBtn);

  const menu = box.querySelector(".focus-menu");
  const toggleBtn = box.querySelector("[data-focus-toggle]");
  toggleBtn.addEventListener("click", () => { menu.hidden = !menu.hidden; });
  document.addEventListener("click", ev => { if (!box.contains(ev.target)) menu.hidden = true; });

  const exit = () => {
    teardownAssignmentBuilder(exercisePanel);
    toggleBtn.classList.remove("on");
  };
  const startBuilding = opts => {
    menu.hidden = true;
    if (exercisePanel.dataset.building === "1") { exit(); return; }
    setupAssignmentBuilder(exercisePanel, splitApi, exit, opts);
    toggleBtn.classList.add("on");
  };

  const assignBtn = box.querySelector("[data-focus-assign]");
  if (assignBtn) assignBtn.addEventListener("click", () => startBuilding());

  const editBtn = box.querySelector("[data-focus-edit-assign]");
  if (editBtn) editBtn.addEventListener("click", () => startBuilding({ editFromUrl: true }));
}

// #exercise-panel-content (the split-view/practice-panel container) only ever wraps one
// section's own "Section Exercises" — on a chapter's last section, the bundled Chapter
// Review Exercises/Practice Test (CLAUDE.md) render as ordinary page content *outside*
// this container (it closes right before their <h2>s), so they never show up in the
// practice panel and this never sees them either. In practice that means there's always
// exactly one heading group in here, but this stays generic (grouping by whichever <h2>
// precedes each exercise, matched against the current #hash) rather than assuming that,
// so it degrades sensibly instead of silently mis-scoping if that ever changes.
function currentExerciseGroup(panel) {
  const hashId = location.hash.slice(1);
  const groups = []; let cur = null;
  [...panel.children].forEach(el => {
    if (el.tagName === "H2") { cur = { id: el.id, items: [] }; groups.push(cur); return; }
    if (cur && el.classList.contains("exercise")) cur.items.push(el);
  });
  if (!groups.length) return [];
  return (groups.find(g => g.id === hashId) || groups[0]).items;
}

// A stable identifier for one exercise, used both to encode ?assign= links and to filter
// exercises back out when reading one. `.exercise` elements DON'T reliably carry an id
// attribute — some sections' exercises have id="ex341" etc. (needed for Key Concepts
// cross-links), most don't — so an empty ex.id would collapse every exercise on those
// pages onto the same key (found: checking any exercise beyond the first never moved the
// "selected" count, because every one of them was silently adding "" to the Set). The
// number in the ".n" badge is always present and is exactly what's printed on the page,
// so it's both reliable and legible in the generated link. Falls back to the DOM id, then
// a 1-based position, only for the rare unnumbered exercise (build-section.mjs's
// "be-prepared" case) that has neither.
function exerciseKey(ex, index) {
  const n = ex.querySelector(":scope > .n");
  if (n && n.textContent.trim()) return n.textContent.trim();
  if (ex.id) return ex.id;
  return String(index + 1);
}

function setupAssignmentBuilder(panel, splitApi, onDone, opts) {
  panel.dataset.building = "1";
  if (splitApi) splitApi.forceOpen();

  const items = currentExerciseGroup(panel);

  // Rather than guess whether an instruction paragraph still applies to whatever subset
  // of exercises got picked (see exerciseHasSubParts — no wording-based heuristic covers
  // every case, e.g. a bare true/false statement has no sub-parts but still depends on its
  // header), let the teacher decide directly: one checkbox per instruction paragraph,
  // scoped to the H2 section actually being built right now. hdrIdx is the same 0-based,
  // in-document-order index initAssignment uses to read hdr= back.
  const h2El = currentH2Element(panel);
  const headerGroups = [];
  let hdrIdx = -1;
  exercisePanelGroups(panel).forEach(g => {
    if (!g.isP) return;
    hdrIdx++;
    if (g.h2El === h2El) headerGroups.push({ group: g, idx: hdrIdx });
  });

  // "Edit this assignment" (only offered when the page was opened via a ?assign= link —
  // see initFocusTools) seeds the checkboxes from what's on screen right now instead of a
  // blank slate: an exercise/instruction is currently visible (not .assign-hidden) exactly
  // when initAssignment decided it belongs in the current link, whether that came from an
  // explicit hdr= choice or the heuristic fallback. This has to run *before* the defensive
  // unhide below, which erases that signal. "Build tonight's assignment" always starts
  // fresh (empty exercises, every instruction shown) regardless of the current URL.
  const editing = !!(opts && opts.editFromUrl);
  const selected = new Set();
  const selectedHeaders = new Set();
  if (editing) {
    items.forEach((ex, i) => { if (!ex.classList.contains("assign-hidden")) selected.add(exerciseKey(ex, i)); });
    headerGroups.forEach(({ group, idx }) => { if (!group.els[0].classList.contains("assign-hidden")) selectedHeaders.add(idx); });
  } else {
    headerGroups.forEach(({ idx }) => selectedHeaders.add(idx));
  }

  // Defensive unhide: a stale ?assign= filter (or a previous builder session) may have
  // left exercises AND their now-empty headings/intro paragraphs hidden — the checkboxes
  // above already captured whatever that hidden state meant for a pre-populated edit, so
  // it's safe to clear it and show the full panel to build/edit against.
  panel.querySelectorAll(".assign-hidden").forEach(el => el.classList.remove("assign-hidden"));

  const bar = document.createElement("div");
  bar.className = "assign-bar";
  bar.innerHTML =
    `<strong class="assign-count">${selected.size} selected</strong>` +
    `<span class="spacer"></span>` +
    `<button class="iconbtn assign-copy"${selected.size ? "" : " disabled"}>Copy link</button>` +
    `<button class="iconbtn assign-done">Done</button>`;
  panel.insertBefore(bar, panel.firstChild);

  const countEl = bar.querySelector(".assign-count");
  const copyBtn = bar.querySelector(".assign-copy");
  const update = () => {
    countEl.textContent = `${selected.size} selected`;
    copyBtn.disabled = selected.size === 0;
  };

  items.forEach((ex, i) => {
    ex.classList.add("pickable");
    const key = exerciseKey(ex, i);
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "ex-pick";
    cb.checked = selected.has(key);
    cb.setAttribute("aria-label", "Include this exercise in tonight's assignment");
    ex.insertBefore(cb, ex.firstChild);
    cb.addEventListener("change", () => {
      if (cb.checked) selected.add(key); else selected.delete(key);
      update();
    });
  });

  headerGroups.forEach(({ group, idx }) => {
    const firstEl = group.els[0];
    firstEl.classList.add("hdr-pickable");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "hdr-pick";
    cb.checked = selectedHeaders.has(idx);
    cb.setAttribute("aria-label", "Show this instruction line in tonight's assignment");
    firstEl.insertBefore(cb, firstEl.firstChild);
    cb.addEventListener("change", () => {
      if (cb.checked) selectedHeaders.add(idx); else selectedHeaders.delete(idx);
    });
  });

  copyBtn.addEventListener("click", () => {
    if (!selected.size) return;
    // Keeps the current #hash (e.g. "#chapter-review-exercises") so a student opening the
    // link also lands scrolled to the right heading, same as any other section link. hdr=
    // is only worth sending if this section actually has instruction paragraphs to choose
    // from — omitting it (rather than sending an empty list) lets initAssignment fall
    // back cleanly for sections built before this feature existed.
    const hdrParam = headerGroups.length ? `&hdr=${[...selectedHeaders].sort((a, b) => a - b).join(",")}` : "";
    const url = `${location.origin}${location.pathname}?assign=${[...selected].join(",")}${hdrParam}${location.hash}`;
    navigator.clipboard.writeText(url).then(() => {
      const orig = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    }).catch(() => {});
  });

  bar.querySelector(".assign-done").addEventListener("click", onDone);
}

function teardownAssignmentBuilder(panel) {
  panel.dataset.building = "";
  const bar = panel.querySelector(".assign-bar");
  if (bar) bar.remove();
  panel.querySelectorAll(".exercise.pickable").forEach(ex => {
    ex.classList.remove("pickable");
    const cb = ex.querySelector(":scope > input.ex-pick");
    if (cb) cb.remove();
  });
  panel.querySelectorAll(".hdr-pickable").forEach(el => {
    el.classList.remove("hdr-pickable");
    const cb = el.querySelector(":scope > input.hdr-pick");
    if (cb) cb.remove();
  });
}

// True if an exercise restates its own setup well enough that it doesn't depend on a
// preceding shared instruction — detected narrowly as "has its own lettered ⓐ/ⓑ sub-parts"
// (a <ul class="tight"> right in the problem body, e.g. "Given the function k(t)=2t-1:
// ⓐ Evaluate k(2). ⓑ Solve k(t)=7."), NOT "contains any prose at all." A broader prose
// check sounds more complete but isn't reliable: a bare true/false statement ("Every
// one-to-one function has an inverse.") has plenty of words yet still depends on its
// header to know what action to take, and tightening to a leading-verb allowlist just
// trades that false positive for a false negative elsewhere (College Algebra 4.1's "use a
// calculator..." group has one exercise phrased as "Table 12 shows the input w and output
// k...," no leading verb, which would wrongly split an otherwise-uniform group). This
// narrower rule has no known false positive — the tradeoff is it misses exercises that
// restate their setup in a single sentence with no sub-parts (e.g. college-algebra-2e 3-1's
// #32, "Given the function g(x)=5-x^2, evaluate (g(x+h)-g(x))/h") — that residual class
// needs a human hand-pass call, not a heuristic, same as sol-hints/Key-Concepts-links.
function exerciseHasSubParts(ex) {
  return !!ex.querySelector(":scope > .body > ul.tight");
}

// A heading (h2/h3) or loose intro paragraph ("For the following exercises...") is a
// direct child of #exercise-panel-content, same level as the .exercise divs — an h2/h3
// governs every .exercise up to the next heading of equal-or-higher rank, a <p> governs
// just the run of .exercise up to whatever direct-child element comes next. Grouping this
// way (rather than assuming one heading per page) means it stays correct even where a
// section has several h3 subheadings each with their own intro line, like 2.7's "Verbal"/
// "Algebraic"/"Graphical" split.
function exercisePanelGroups(panel) {
  const groups = []; let openH2 = null, openH3 = null, openP = null;
  [...panel.children].forEach(el => {
    if (el.tagName === "H2") { openH2 = { els: [el], exercises: [] }; groups.push(openH2); openH3 = null; openP = null; return; }
    if (el.tagName === "H3") { openH3 = { els: [el], exercises: [] }; groups.push(openH3); openP = null; return; }
    if (el.tagName === "P") {
      // A run of intro paragraphs with no exercises between them (e.g. "For the following
      // exercises, evaluate the expressions, given functions f, g, and h:" immediately
      // followed by the f/g/h definitions themselves) is one shared intro, not two — fold
      // it into the still-open paragraph instead of starting a fresh (permanently-empty,
      // permanently-hidden) group. Found via ?assign= links where a section's very first
      // instruction line never reappeared no matter what was selected, because its "real"
      // group had already been superseded by the next paragraph before any exercise
      // arrived to claim it.
      // h2El records which H2 this instruction paragraph lives under, so the assignment
      // builder can scope its "show this instruction?" checkboxes to only the section
      // currently being built (see currentH2Element).
      if (openP && openP.exercises.length === 0) { openP.els.push(el); return; }
      openP = { els: [el], exercises: [], isP: true, h2El: openH2 ? openH2.els[0] : null }; groups.push(openP); return;
    }
    if (el.classList.contains("exercise")) {
      [openH2, openH3, openP].forEach(g => { if (g) g.exercises.push(el); });
    }
  });
  return groups;
}

// Same H2-matching rule as currentExerciseGroup (match #hash, else the first H2) but
// returns the element itself — used to scope which instruction-paragraph checkboxes the
// assignment builder shows, and which paragraphs a teacher's explicit hdr= choices apply
// to, for the (currently hypothetical, per currentExerciseGroup's own note) case of more
// than one H2 in the panel.
function currentH2Element(panel) {
  const hashId = location.hash.slice(1);
  const h2s = [...panel.children].filter(el => el.tagName === "H2");
  if (!h2s.length) return null;
  return h2s.find(el => el.id === hashId) || h2s[0];
}

// Reading side of an assignment link: hides every exercise on the page not in the
// selected set (prose/examples/Try Its are untouched — only #exercise-panel-content is
// touched), then hides any heading/intro paragraph whose exercises were *all* filtered
// out, so a filtered page doesn't show a bare "Algebraic" heading or instruction line
// with nothing left under it. Forces the practice panel open, same as the builder does,
// so a student opening the link lands looking at exactly what's assigned.
function initAssignment(splitApi) {
  const params = new URLSearchParams(location.search);
  const raw = params.get("assign");
  if (!raw) return;
  const panel = document.getElementById("exercise-panel-content");
  if (!panel) return;
  const ids = new Set(raw.split(","));
  [...panel.querySelectorAll(".exercise")].forEach((ex, i) => { if (!ids.has(exerciseKey(ex, i))) ex.classList.add("assign-hidden"); });

  // A teacher can explicitly show/hide each instruction paragraph in the assignment
  // builder (checkbox next to it, defaulting to shown) rather than leaving it to a
  // guess — see setupAssignmentBuilder. hdr= lists the (0-based, in-document-order) index
  // of every instruction paragraph the teacher left checked; its absence (an older link,
  // or one built before this feature) falls back to the auto-detection heuristic below.
  // hdr= only ever covers paragraphs under the H2 the builder was scoped to, so a
  // paragraph under any *other* H2 (see currentExerciseGroup's note — currently
  // hypothetical, since #exercise-panel-content only ever wraps one) still falls back to
  // the heuristic even when hdr= is present, rather than being force-hidden as "not
  // mentioned."
  const hdrRaw = params.get("hdr");
  const explicitHdrs = hdrRaw === null ? null : new Set(hdrRaw === "" ? [] : hdrRaw.split(",").map(Number));
  const h2El = currentH2Element(panel);
  let hdrIdx = -1;

  // Array.every() on an empty array is vacuously true, which is exactly what's wanted
  // for a heading with zero exercises under it (e.g. Intermediate Algebra's trailing
  // "Self Check" reflection checklist, which is a heading + image, no .exercise at all)
  // — assignment mode means "only the selected exercises," so a non-exercise heading like
  // that should always be hidden, not skipped for having nothing to check.
  exercisePanelGroups(panel).forEach(g => {
    let exercises = g.exercises;
    if (g.isP) {
      hdrIdx++;
      if (explicitHdrs !== null && g.h2El === h2El) {
        if (!explicitHdrs.has(hdrIdx)) g.els.forEach(el => el.classList.add("assign-hidden"));
        return; // teacher's explicit choice is authoritative either way — skip the heuristic below
      }
      // An intro paragraph's DOM scope runs to the next heading/paragraph, but some of
      // the exercises inside that scope restate their own setup in words (see
      // exerciseHasSubParts) and never actually depended on the shared instruction — e.g.
      // 3.1's "For the following exercises, evaluate f(-3),f(2),..." really only governs
      // #27-31, but #34-39 restate their own function and sub-parts and just happen to
      // fall in the same DOM run, so assigning only #35 left that unrelated instruction
      // showing above it. Detected only when the group is a *mix* of both kinds — a
      // paragraph whose exercises ALL have sub-parts already behaves correctly under the
      // plain rule, and forcing the same exclusion there would risk hiding an instruction
      // every one of them still needs. Known gap: a self-contained exercise with no
      // lettered sub-parts (e.g. #32, "Given the function g(x)=5-x^2, evaluate...") isn't
      // caught by this — see exerciseHasSubParts's comment for why that's a deliberate,
      // not accidental, limit; a teacher hitting that gap can just uncheck the header by
      // hand instead.
      const plain = exercises.filter(ex => !exerciseHasSubParts(ex));
      if (plain.length > 0 && plain.length < exercises.length) exercises = plain;
    }
    if (exercises.every(ex => ex.classList.contains("assign-hidden"))) {
      g.els.forEach(el => el.classList.add("assign-hidden"));
    }
  });
  if (splitApi) splitApi.forceOpen();
}

/* ---------- page outline: collapsible groups per section heading ---------- */
function buildOutline(container) {
  const main = document.querySelector("main");
  if (!main || !container) return;
  const nodes = main.querySelectorAll("h2[id], .example, .tryit, .card.qa, .card.howto, .card.activity");
  const norm = s => (s || "").replace(/\s+/g, " ").trim();
  const short = (s, n = 36) => {
    s = norm(s);
    if (s.length <= n) return s;
    let cut = s.slice(0, n - 1);
    // Never cut inside a \(...\)/\[...\] math span -- KaTeX can't render a truncated
    // expression and just dumps the raw source, so back the cut up to before the
    // opening delimiter instead of leaving a dangling \( or \[.
    const lastOpen = Math.max(cut.lastIndexOf("\\("), cut.lastIndexOf("\\["));
    if (lastOpen !== -1) {
      const close = cut[lastOpen + 1] === "(" ? "\\)" : "\\]";
      if (s.indexOf(close, lastOpen) === -1 || s.indexOf(close, lastOpen) + 2 > n) {
        cut = s.slice(0, lastOpen).trimEnd();
      }
    }
    return cut + "…";
  };
  const groups = []; let cur = null;
  const counters = { ex: 0, qa: 0, how: 0, act: 0 };
  nodes.forEach(el => {
    if (el.closest("details.bigfold")) return;           // skip optional warm-up content
    if (el.tagName === "H2") { cur = { id: el.id, title: norm(el.textContent), items: [] }; groups.push(cur); return; }
    if (!cur) return;
    let id, badge, cls, label;
    if (el.classList.contains("activity")) {
      id = el.id || (el.id = "activity-" + (++counters.act));
      badge = el.classList.contains("preview") ? "PA" : "Act"; cls = "b-act";
      label = short(el.querySelector(".ex-head .num")?.textContent || "Activity");
    } else if (el.classList.contains("example")) {
      id = el.id || (el.id = "example-" + (++counters.ex)); badge = "Ex"; cls = "b-ex";
      const num = el.querySelector(".ex-head .num")?.textContent || "Example";
      const t = el.querySelector(".ex-head .t")?.textContent || "";
      label = short(num + (t ? " · " + t : ""));
    } else if (el.classList.contains("tryit")) {
      if (!el.id) return; id = el.id; badge = "Try"; cls = "b-try";
      label = short(el.querySelector(".ex-head .num")?.textContent || "Try It");
    } else if (el.classList.contains("qa")) {
      id = el.id || (el.id = "qa-" + (++counters.qa)); badge = "Q&A"; cls = "b-qa";
      label = short(el.querySelector(".q")?.textContent || "Q&A");
    } else {
      id = el.id || (el.id = "howto-" + (++counters.how)); badge = "How"; cls = "b-how";
      label = short((el.querySelector("strong")?.textContent || "How To").replace(/^Given /, ""));
    }
    cur.items.push({ id, badge, cls, label });
  });

  let html = "<h4>On this page</h4>";
  for (const g of groups) {
    if (!g.items.length) { html += `<a class="lvl1 solo" href="#${g.id}">${g.title}</a>`; continue; }
    html += `<details class="ogroup"><summary><a class="lvl1" href="#${g.id}">${g.title}</a></summary>` +
      g.items.map(it => `<a class="lvl2" href="#${it.id}"><span class="b ${it.cls}">${it.badge}</span>${it.label}</a>`).join("") +
      `</details>`;
  }
  container.innerHTML = html;

  const links = [...container.querySelectorAll("a")];
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const sbEl = container.closest(".sidebar");
  let current = null;

  /* Groups stay condensed: the spy never expands them. If the active item's group is
     closed, its group heading is highlighted instead. Only a user click expands.
     Never call scrollIntoView here — it can move the page scroll and fight the user. */
  const setActive = (a, userClick) => {
    if (!a) return;
    const g = a.closest("details.ogroup");
    if (g && !g.open && !userClick) a = g.querySelector("summary a.lvl1") || a;
    if (a === current) return;
    current = a;
    links.forEach(x => { x.classList.remove("active"); x.removeAttribute("aria-current"); });
    a.classList.add("active");
    a.setAttribute("aria-current", "true");
    if (sbEl) {                                           // keep visible by scrolling the sidebar only
      const r = a.getBoundingClientRect(), s = sbEl.getBoundingClientRect();
      if (r.top < s.top + 60 || r.bottom > s.bottom - 20) sbEl.scrollTop += r.top - s.top - 110;
    }
  };
  let holdUntil = 0;

  /* click: navigate, expand that group (explicit user intent), open folds around target */
  container.addEventListener("click", e => {
    const a = e.target.closest("a[href^='#']"); if (!a) return;
    e.preventDefault();                                   // keeps summary clicks from toggling the group
    const id = a.getAttribute("href").slice(1);
    const t = document.getElementById(id); if (!t) return;
    t.closest("details:not(.ogroup)")?.setAttribute("open", "");
    const g = a.closest("details.ogroup"); if (g) g.open = true;
    setActive(a, true);
    holdUntil = Date.now() + 1000;                        // let the smooth scroll finish before spy resumes
    t.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", "#" + id);
  });

  /* scrollspy: last visible target above the reading line (works for short end-of-page sections),
     rAF-throttled, and ignores the sidebar's own scroll events to avoid feedback loops */
  const targets = links.map(a => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
  const spy = () => {
    if (Date.now() < holdUntil) return;
    let best = null, bestTop = -Infinity;
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    for (const t of targets) {
      if (!t.getClientRects().length) continue;           // hidden (e.g., inside a closed fold)
      const top = t.getBoundingClientRect().top;
      if ((top <= 140 || atBottom) && top > bestTop && top < innerHeight) { bestTop = top; best = t; }
    }
    if (best) setActive(map.get(best.id));
  };
  let ticking = false;
  addEventListener("scroll", e => {
    if (e.target === sbEl) return;                        // sidebar scrolling must not retrigger the spy
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; spy(); });
  }, { passive: true, capture: true });                   // capture also catches the practice panel's scroll
  spy();
}

/* ---------- split view: content left, section exercises right ---------- */
// Returns a small API ({ forceOpen }) instead of nothing so other features (the
// assignment builder, and reading an ?assign= link) can force the panel open without
// reaching into this closure's private `on` state or duplicating the toggle logic.
// Returns null wherever there's no exercise panel/theme button to attach to.
function setupSplit() {
  const panel = document.getElementById("exercise-panel-content");
  if (!panel) return null;
  const themeBtn = document.querySelector("[data-theme-toggle]");
  if (!themeBtn) return null;
  const btn = document.createElement("button");
  btn.className = "iconbtn splitbtn";
  btn.title = "Show exercises beside the reading";
  btn.textContent = "⇄ Practice panel";
  themeBtn.parentElement.insertBefore(btn, themeBtn);
  const key = "mxalg-split";
  const apply = on => { document.body.classList.toggle("split", on); btn.classList.toggle("on", on); };
  let on = localStorage.getItem(key) === "1" && matchMedia("(min-width: 1100px)").matches;
  apply(on);
  btn.addEventListener("click", () => { on = !on; localStorage.setItem(key, on ? "1" : "0"); apply(on); });
  return {
    // Session-only force (never writes localStorage) — a teacher building tonight's
    // assignment, or a student opening one, shouldn't have their own saved practice-panel
    // preference silently overwritten. No-ops below 1100px, matching .splitbtn's own
    // display:none there — the split layout isn't usable on a narrow screen anyway.
    forceOpen: () => {
      if (!matchMedia("(min-width: 1100px)").matches) return;
      on = true; apply(on);
    },
  };
}

/* ---------- tiny SVG function plotter ----------
   Reads JSON from the element's data-spec attribute:
   { xmin,xmax,ymin,ymax, xstep,ystep, w,h,
     curves:[{fn:"Math.pow(2,x)", cls:"", label:"", labelAt:[x,y]}],
     points:[[x,y,"label"]], xlabel, ylabel }                       */
function drawPlot(el) {
  let s; try { s = JSON.parse(el.dataset.spec); } catch (e) { return; }
  const W = s.w || 560, H = s.h || 380, pad = { l: 52, r: 18, t: 16, b: 42 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = x => pad.l + (x - s.xmin) / (s.xmax - s.xmin) * iw;
  const Y = y => pad.t + ih - (y - s.ymin) / (s.ymax - s.ymin) * ih;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W);
  svg.setAttribute("role", "img");
  if (s.alt) { const t = document.createElementNS(NS, "title"); t.textContent = s.alt; svg.appendChild(t); }
  const add = (tag, attrs, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n); return n;
  };
  // grid + tick labels
  const xs = s.xstep || Math.ceil((s.xmax - s.xmin) / 10);
  const ys = s.ystep || Math.ceil((s.ymax - s.ymin) / 10);
  for (let x = Math.ceil(s.xmin / xs) * xs; x <= s.xmax; x += xs) {
    add("line", { x1: X(x), y1: pad.t, x2: X(x), y2: pad.t + ih, class: "grid" });
    const tl = add("text", { x: X(x), y: pad.t + ih + 18, "text-anchor": "middle" });
    tl.textContent = +x.toFixed(6);
  }
  for (let y = Math.ceil(s.ymin / ys) * ys; y <= s.ymax; y += ys) {
    add("line", { x1: pad.l, y1: Y(y), x2: pad.l + iw, y2: Y(y), class: "grid" });
    const tl = add("text", { x: pad.l - 8, y: Y(y) + 4, "text-anchor": "end" });
    tl.textContent = +y.toFixed(6);
  }
  // axes at 0 (or at edge)
  const ax = s.xmin <= 0 && s.xmax >= 0 ? X(0) : pad.l;
  const ay = s.ymin <= 0 && s.ymax >= 0 ? Y(0) : pad.t + ih;
  add("line", { x1: pad.l, y1: ay, x2: pad.l + iw, y2: ay, class: "axis" });
  add("line", { x1: ax, y1: pad.t, x2: ax, y2: pad.t + ih, class: "axis" });
  // axis labels
  if (s.xlabel) { const t = add("text", { x: pad.l + iw / 2, y: H - 6, "text-anchor": "middle" }); t.textContent = s.xlabel; }
  if (s.ylabel) {
    const t = add("text", { x: 14, y: pad.t + ih / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${pad.t + ih / 2})` });
    t.textContent = s.ylabel;
  }
  // curves
  for (const c of s.curves || []) {
    const fn = new Function("x", "return " + c.fn);
    let d = "", pen = false;
    const n = 240;
    for (let i = 0; i <= n; i++) {
      const x = s.xmin + (s.xmax - s.xmin) * i / n;
      let y; try { y = fn(x); } catch (e) { y = NaN; }
      if (!isFinite(y) || y < s.ymin - (s.ymax - s.ymin) || y > s.ymax + (s.ymax - s.ymin)) { pen = false; continue; }
      const px = X(x), py = Math.max(pad.t - 40, Math.min(pad.t + ih + 40, Y(y)));
      d += (pen ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1); pen = true;
    }
    add("path", { d, class: "curve " + (c.cls || "") });
    if (c.label && c.labelAt) {
      const t = add("text", { x: X(c.labelAt[0]) + 6, y: Y(c.labelAt[1]), class: "ptlabel" });
      t.textContent = c.label;
    }
  }
  // points
  for (const p of s.points || []) {
    add("circle", { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: "pt" });
    if (p[2]) { const t = add("text", { x: X(p[0]) + 8, y: Y(p[1]) - 8, class: "ptlabel" }); t.textContent = p[2]; }
  }
  el.appendChild(svg);
}

/* ---------- Desmos interactive plotter ----------
   For figures that demonstrate a parameter (a, b, c, d...) rather than a single
   fixed curve. Reads JSON from data-spec:
   { bounds:{left,right,bottom,top},
     sliders:[{var:"a", min,max,step, value, color}],
     curves:[{latex:"y=a\\cdot b^{x}", color, domain:{min,max}}],
     alt }
   Requires window.Desmos (loaded via a per-page <script> with an API key — see
   CLAUDE.md). If the API script failed to load (offline, key issue, ad blocker),
   the figure is silently skipped; the figcaption/alt text still describes it.

   curves[].domain: for a parametric tuple "(x(t),y(t))" or polar "r=f(θ)" curve
   that needs to trace more than Desmos's default parameter range, DO NOT rely on
   a "\left\{min \le t \le max\right\}" restriction embedded in the latex — Desmos
   still shows (and actually uses) a separate auto-added "domain t Min/Max" pair of
   fields for parametric/polar plots, which defaults to 0–1 regardless of what the
   embedded inequality says, so the curve silently renders truncated to that range
   (found in calculus-v3 1-1's hypocycloid Figure 10, meant to sweep 0 to 24π —
   flagged by the project owner as "defaulting to 0<t<1"). The API's dedicated
   parametricDomain/polarDomain options are the only things that actually set those
   fields; set both unconditionally when curves[].domain is present since a given
   curve only recognizes the one matching its own type (tuple vs. r=) and ignores
   the other. */
function drawDesmos(el) {
  let s; try { s = JSON.parse(el.dataset.spec); } catch (e) { return; }
  if (typeof Desmos === "undefined") return;
  const holder = document.createElement("div");
  holder.className = "desmos-embed";
  if (s.alt) holder.setAttribute("aria-label", s.alt);
  el.appendChild(holder);
  const calc = Desmos.GraphingCalculator(holder, {
    expressions: true,
    expressionsCollapsed: false,
    keypad: false,
    settingsMenu: false,
    zoomButtons: false,
    border: false,
    lockViewport: false,
  });
  if (s.bounds) calc.setMathBounds(s.bounds);
  (s.sliders || []).forEach((sl, i) => {
    calc.setExpression({
      id: "slider-" + i,
      latex: `${sl.var}=${sl.value}`,
      sliderBounds: { min: sl.min, max: sl.max, step: sl.step },
      color: sl.color || "#1f1d1d",
    });
  });
  (s.curves || []).forEach((c, i) => {
    const expr = { id: "curve-" + i, latex: c.latex, color: c.color || "#cf003d" };
    if (c.domain) { expr.parametricDomain = c.domain; expr.polarDomain = c.domain; }
    calc.setExpression(expr);
  });
}
