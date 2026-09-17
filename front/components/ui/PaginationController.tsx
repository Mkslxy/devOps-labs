"use client";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";

interface PaginationControllerProps {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

export function PaginationController({
                                         page,
                                         pageSize,
                                         totalCount,
                                         onPageChange,
                                     }: PaginationControllerProps) {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) onPageChange(page - 1);
                        }}
                    />
                </PaginationItem>

                {pages.map((p) => (
                    <PaginationItem key={p}>
                        <PaginationLink
                            href="#"
                            isActive={p === page}
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange(p);
                            }}
                        >
                            {p}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) onPageChange(page + 1);
                        }}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
