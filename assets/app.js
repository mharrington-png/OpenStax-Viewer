/* MX Algebra reader — shared behavior */

/* ---------- book manifests ----------
   Keyed by book id. Each page declares which book it belongs to via
   <body data-book="...">; missing/unset defaults to "college-algebra-2e" so
   existing pages built before multi-book support keep working unchanged.
   `sectionsDir` is the path (relative to site root) where that book's section
   files live — College Algebra 2e's files stay at the root sections/ folder
   for backward compatibility; new books are scoped under sections/<book-id>/
   to avoid chapter-number collisions (e.g. Calculus Vol 1's own Chapter 2). */
const BOOKS = {
  "college-algebra-2e": {
    title: "College Algebra",
    license: { name: "Creative Commons Attribution 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    source: { name: "OpenStax College Algebra 2e", url: "https://openstax.org/books/college-algebra-2e", author: "Jay Abramson" },
    sectionsDir: "sections",
    chapters: [
      { n: 3, title: "Functions", sections: [
        { id: "3-1", title: "3.1 Functions and Function Notation", file: "3-1.html", ready: true },
        { id: "3-2", title: "3.2 Domain and Range", file: "3-2.html", ready: true },
        { id: "3-3", title: "3.3 Rates of Change and Behavior of Graphs", file: "3-3.html", ready: true },
        { id: "3-4", title: "3.4 Composition of Functions", file: "3-4.html", ready: true },
        { id: "3-5", title: "3.5 Transformation of Functions", file: "3-5.html", ready: true },
        { id: "3-6", title: "3.6 Absolute Value Functions", file: "3-6.html", ready: true },
        { id: "3-7", title: "3.7 Inverse Functions", file: "3-7.html", ready: true },
        { id: "3-7-review", title: "Chapter Review Exercises", file: "3-7.html#chapter-review-exercises", ready: true },
        { id: "3-7-practice", title: "Practice Test", file: "3-7.html#practice-test", ready: true },
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
        { id: "6-8-practice", title: "Practice Test", file: "6-8.html#practice-test", ready: true },
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
  // tag rather than assuming a fixed nesting depth: College Algebra 2e section files sit
  // one level down (sections/6-1.html, root "..") but new books are scoped one level
  // deeper (sections/calculus-v1/2-1.html, root "../..") and books/<id>/index.html is
  // also one level down. Reading it off the script tag works at any depth automatically.
  const appScript = document.querySelector('script[src$="assets/app.js"]');
  const scriptSrc = appScript ? appScript.getAttribute("src") : "assets/app.js";
  const root = scriptSrc.replace(/assets\/app\.js$/, "").replace(/\/$/, "") || ".";

  // which book this page belongs to: <body data-book="..."> wins; unset/unknown
  // falls back to college-algebra-2e so pre-multi-book pages never break.
  const bookId = (document.body.dataset.book && BOOKS[document.body.dataset.book]) ? document.body.dataset.book : DEFAULT_BOOK;
  const BOOK = BOOKS[bookId];

  /* sidebar: collapsible book contents + auto-generated page outline */
  const sb = document.querySelector(".sidebar");
  if (sb) {
    // section files may live at root sections/ (College Algebra 2e, legacy) or a
    // book-scoped subfolder sections/<book-id>/ (new books) — sectionsDir already
    // encodes which, relative to site root.
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
          book += `<a href="${root}/${BOOK.sectionsDir}/${s.file}"${active}>${s.title}</a>`;
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
      `<a class="allbooks" href="${root}/index.html">← All books</a>` +
      `<details class="booknav"${isSection ? "" : " open"}><summary>Book contents</summary>${book}</details>` +
      `<div class="outline"></div>`;
    if (isSection) buildOutline(sb.querySelector(".outline"));

    /* whole-sidebar show/hide toggle, persisted, independent of practice panel */
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      const btn = document.createElement("button");
      btn.className = "iconbtn navbtn";
      btn.title = "Show or hide the contents sidebar";
      btn.textContent = "☰";
      topbar.insertBefore(btn, topbar.firstChild);
      const key = "mxalg-nav";
      const apply = on => { document.body.classList.toggle("nosidebar", !on); btn.classList.toggle("on", on); };
      let on = localStorage.getItem(key) !== "0";
      apply(on);
      btn.addEventListener("click", () => { on = !on; localStorage.setItem(key, on ? "1" : "0"); apply(on); });
    }
  }

  // site-wide search — independent of the sidebar so it also appears on the top-level
  // book-picker page (index.html), which has a topbar but no .sidebar nav.
  const topbarEl = document.querySelector(".topbar");
  if (topbarEl) initSearch(root, topbarEl);

  // theme button
  document.querySelectorAll("[data-theme-toggle]").forEach(b => b.addEventListener("click", toggleTheme));

  // split practice panel
  setupSplit();

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
    btn.addEventListener("click", () => {
      const sol = btn.closest(".solution");
      sol.classList.toggle("open");
      const tryit = btn.closest(".tryit");
      if (tryit && sol.classList.contains("open")) tryit.classList.add("answered");
    });
  });

  // exercise answer buttons
  document.querySelectorAll(".exercise .answer > button").forEach(btn => {
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
      if (mark === b.dataset.mark) b.classList.add(b.dataset.mark === "right" ? "on-right" : "on-wrong");
      b.addEventListener("click", () => {
        saved[id] = b.dataset.mark;
        localStorage.setItem(pageKey, JSON.stringify(saved));
        t.querySelectorAll(".selfcheck button").forEach(x => x.classList.remove("on-right", "on-wrong"));
        b.classList.add(b.dataset.mark === "right" ? "on-right" : "on-wrong");
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
    footer.innerHTML =
      `Content from <a href="${BOOK.source.url}">${BOOK.source.name}</a> by ${BOOK.source.author}, © OpenStax, licensed under ` +
      `<a href="${BOOK.license.url}">${BOOK.license.name}</a>. ` +
      `OpenStax is not affiliated with this site and does not endorse it. Access the original free at <a href="https://openstax.org">openstax.org</a>.`;
  }

  // math
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  }

  // plots
  document.querySelectorAll("[data-plot]").forEach(drawPlot);
  document.querySelectorAll("[data-desmos]").forEach(drawDesmos);
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
    `<input type="search" class="search-input" placeholder="Search topics, skills, or objectives…" aria-label="Search all books" autocomplete="off">` +
    `<div class="search-results" hidden></div>`;
  const spacer = topbar.querySelector(".spacer");
  if (spacer) spacer.after(box); else topbar.appendChild(box);

  const input = box.querySelector(".search-input");
  const resultsEl = box.querySelector(".search-results");
  let indexPromise = null, activeIdx = -1, indexError = false;

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

  function render(items, q) {
    activeIdx = -1;
    if (!items.length) {
      resultsEl.innerHTML = `<div class="search-empty">No matches for “${esc(q)}”.</div>`;
      resultsEl.hidden = false;
      return;
    }
    resultsEl.innerHTML = items.map(e => {
      const href = `${root}/${e.path}#${e.anchor}`;
      const detail = e.detail ? `<div class="search-detail">${esc(e.detail)}</div>` : "";
      return `<a class="search-result" href="${href}">` +
        `<div class="search-eyebrow">${esc(e.bookTitle)} · ${esc(e.sectionTitle)}</div>` +
        `<div class="search-main">${highlight(e.text, q)}</div>${detail}</a>`;
    }).join("");
    resultsEl.hidden = false;
  }

  let debounceT;
  input.addEventListener("input", () => {
    clearTimeout(debounceT);
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { resultsEl.hidden = true; resultsEl.innerHTML = ""; return; }
    debounceT = setTimeout(async () => {
      const data = await loadIndex();
      if (indexError) {
        resultsEl.innerHTML = `<div class="search-empty">Search index couldn't load. If you opened this page directly from a file (a file:// address), browsers block that fetch — run a local server (e.g. <code>npx serve .</code>) instead, or use the hosted site.</div>`;
        resultsEl.hidden = false;
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
      scored.sort((a, b) => b.score - a.score);
      render(scored.slice(0, 8).map(s => s.e), q);
    }, 120);
  });

  const updateActive = items => {
    items.forEach((el, i) => el.classList.toggle("active", i === activeIdx));
    if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: "nearest" });
  };
  input.addEventListener("keydown", ev => {
    const items = resultsEl.querySelectorAll(".search-result");
    if (ev.key === "Escape") { resultsEl.hidden = true; input.blur(); }
    else if (ev.key === "ArrowDown" && items.length) { ev.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); updateActive(items); }
    else if (ev.key === "ArrowUp" && items.length) { ev.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); updateActive(items); }
    else if (ev.key === "Enter") { const target = items[activeIdx] || items[0]; if (target) { ev.preventDefault(); target.click(); } }
  });
  input.addEventListener("focus", () => { if (resultsEl.innerHTML) resultsEl.hidden = false; });
  document.addEventListener("click", ev => { if (!box.contains(ev.target)) resultsEl.hidden = true; });
}

/* ---------- page outline: collapsible groups per section heading ---------- */
function buildOutline(container) {
  const main = document.querySelector("main");
  if (!main || !container) return;
  const nodes = main.querySelectorAll("h2[id], .example, .tryit, .card.qa, .card.howto");
  const short = (s, n = 36) => {
    s = (s || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  };
  const groups = []; let cur = null;
  const counters = { ex: 0, qa: 0, how: 0 };
  nodes.forEach(el => {
    if (el.closest("details.bigfold")) return;           // skip optional warm-up content
    if (el.tagName === "H2") { cur = { id: el.id, title: short(el.textContent, 42), items: [] }; groups.push(cur); return; }
    if (!cur) return;
    let id, badge, cls, label;
    if (el.classList.contains("example")) {
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
    links.forEach(x => x.classList.remove("active"));
    a.classList.add("active");
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
function setupSplit() {
  const panel = document.getElementById("exercise-panel-content");
  if (!panel) return;
  const themeBtn = document.querySelector("[data-theme-toggle]");
  if (!themeBtn) return;
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
