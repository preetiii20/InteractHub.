Upgrade to Java 21

What changed:
- All microservice `pom.xml` files now set `<java.version>21`.
- `maven-compiler-plugin` configured to use source/target/release 21.

Developer action:
- Install JDK 21 on your machine and ensure JAVA_HOME points to it.
- Verify java version:

  pwsh:
  java -version

- Build each service using the included Maven wrappers in each service folder, e.g.:

  pwsh:
  cd backend-microservices\admin-service
  .\mvnw.cmd -DskipTests package

Notes:
- I attempted to use the automated Copilot upgrade tool but it is not available on this account; changes were applied manually.
- After upgrading, I fixed a few compile issues in `manager` and `chat` services so they build with Java 21.
- If you run into runtime issues, consider upgrading Spring Boot minor versions and verifying dependency compatibility.
