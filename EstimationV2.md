---
runme:
  id: 01HX2JRJZ8VP227YRBFA7FJWFT
  version: v3
---

# Project Estimation - FUTURE

Date: 5/05/2024

Version: 1.0

# Estimation approach

Consider the EZElectronics  project in FUTURE version (as proposed by your team in requirements V2), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch (not from V1)

# Estimate by size

### 

|             | Estimate                        |  
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |    35                         |  
|  A = Estimated average size per class, in LOC       |    300                        |
| S = Estimated size of project, in LOC (= NC * A) | 10500 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |  10500 / 10 = 1050 person hour                                    |  
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 1050 * 30 =  31500|
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 1050 / (4\*8\*5) = 6.56 weeks |

# Estimate by product decomposition

|         component name    | Estimated effort (person hours)   |  
| ----------- | ------------------------------- |
| requirement document    | 80 |
| GUI prototype | 150 |
| design document | 110 |
| code | 500 |
| unit tests | 125 |
| api tests | 75|
| management documents  | 75 |

# Estimate by activity decomposition

|         Activity name    | Estimated effort (person hours)   |  
| ----------- | ------------------------------- |
|   Requirement document   | 95  |
| Analyze state of art |  25 |
| Identify user requirements | 40 |
| Identify performance requirements | 30 |
|  GUI prototype    | 130 |
| Design GUI layout | 40 |
| Develop GUI prototype | 60 |
| Review and iterate on prototype | 30|
|  Design document    | 120 |
|System architecture design| 40 |
|Database design| 45 |
|API design| 35 |
|  Code    | 490 |
| Backend development (database, API)| 230 |
| Frontend development (website design)| 260 |
|  Unit Test    | 117 |
|Write unit tests | 60 |
|Execute unit tests| 7 |
|Fix unit test failures| 50 |
|  Api Test    | 107 |
|Write API tests| 50 |
|Execute API tests| 7 |
|Fix API test failures| 50 |
|  Management documents    | 90 |
| Project planning| 40 |
| Progress tracking and reporting| 50 |

### Gantt

![Image showing the gantt chart](./gantt/gantt_chart_v2.png "Gantt Chart")

# Summary

The estimation by size, by product and activity decomposition differ because the degree of analysis is different. The first two are much more general while the estimation by activity offers a heightened level of detail, enabling a more precise assessment compared to the other two types. This granularity allows for a comprehensive breakdown of various activities. By dividing into specific activities, factors influencing time, resources, and potential risks can be meticulously analyzed and accounted for. 

|             | Estimated effort  (person hours)                      |   Estimated duration (weeks) |  
| ----------- | ------------------------------- | ---------------|
| estimate by size |1050| 6.56|
| estimate by product decomposition | 1115 | 7 |
| estimate by activity decomposition | 1149| 7.2 |




