"""m01-data-flow-diagram — pixel-faithful recreation of the course slide.
Canvas 1000x562 (16:9). Coordinates + colours measured directly from the original slide
(scale = 1000/2001). No copyright/footer/page-number (the only intentional omission)."""
from aws_style import Diagram, P, compare

d = Diagram("Data flow diagram example", width=1000, height=562)

# Containers — plain green VPC box (no cloud icon, like the slide) + dashed AZ
d.vpc(68, 96, 912, 440, label="VPC", cidr="VPC 10.0.0.0/16")
d.az(127, 142, 813, 358, "Availability Zone A")

# User is OUTSIDE the VPC (left of the green border x=68). Vertical line down to badge A.
d.svg_icon("user", 16, 120, 44, 44, "user", "User")
d.badge(16, 295, "A", cid="bA")          # outside the VPC, directly below the user
d.link("user", "bA")                      # vertical line: user -> A

# Internet gateway INSIDE the VPC; A -> IGW arrow crosses the VPC border
d.svg_icon("igw", 76, 295, 50, 50, "internet-gateway", "Internet\ngateway")
d.flow("bA", "igw", double=False)

# Three tiers in their subnets (light fill + official subnet group icon, top-left)
d.subnet(162, 244, 223, 171, "Public subnet", kind="public")
d.svg_icon("web", 247, 294, 52, 52, "ec2", "Web Server")

d.subnet(425, 244, 223, 171, "Private subnet", kind="private")
d.svg_icon("app", 510, 294, 52, 52, "ec2", "Application\nServer")

d.subnet(688, 244, 223, 171, "Private subnet", kind="private")
d.svg_icon("db", 773, 294, 52, 52, "database", "Transaction\nprocessing\ndatabase")

# Tier-to-tier data flows (double-headed), left-to-right
d.flow("igw", "web")
d.flow("web", "app")
d.flow("app", "db")

# Badges B/C on the flows; 1/2/3 trust boundaries
d.badge(383, 296, "B")
d.badge(645, 296, "C")
d.badge(245, 168, "1")
d.badge(514, 409, "2")
d.badge(788, 169, "3")

res = d.save("m01-data-flow-diagram")
print("built:", res.get("src"), "\nweb  :", res.get("web_png"))
print("cmp  :", compare("m01-data-flow-diagram"))
