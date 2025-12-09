import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AccountLoading() {
  return (
    <section>
      <div className="flex flex-col space-y-6 max-w-screen-2xl">
        {/* Skeleton for the header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold">Account</h1>
          <Skeleton className="w-3/4 h-5" />
        </div>

        {/* Skeleton for Usage Stats Section */}
        <Card>
          <CardHeader>
            <Skeleton className="w-1/4 h-8 mb-2" />
            <Skeleton className="w-3/4 h-5" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="w-1/3 h-5" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline">
                      <Skeleton className="w-12 h-8 mr-2" />
                      <Skeleton className="w-20 h-5" />
                    </div>
                    <Skeleton className="w-full h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Skeleton for the forms */}
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full mb-4 md:mb-0 md:w-1/2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="w-3/4 h-16 mb-4" />
                <Skeleton className="w-full h-16 mb-4" />
                <Skeleton className="w-full h-16" />
              </CardContent>
            </Card>
          </div>
          <div className="w-full md:w-1/2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="w-3/4 h-16 mb-4" />
                <Skeleton className="w-full h-16 mb-4" />
                <Skeleton className="w-full h-16" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="w-3/4 h-8 mb-4" />
                <Skeleton className="w-full h-10 mb-4" />
                <Skeleton className="w-full h-10" />
              </CardContent>
            </Card>
          </div>
          <div className="w-full md:w-1/2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="w-3/4 h-8 mb-4" />
                <Skeleton className="w-full h-10 mb-4" />
                <Skeleton className="w-full h-10" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
